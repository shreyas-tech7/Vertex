/*
 * Vertex adapter for CEmu.
 *
 * Copyright (C) 2026 Vertex contributors. Licensed under the GNU General Public License, version 3 or later,
 * because it is linked into CEmu (https://github.com/CE-Programming/CEmu, GPLv3).
 *
 * This file replaces CEmu's own Emscripten front end (core/os/os-emscripten.c). It gives the web worker a small,
 * plain C API: load a ROM or a saved state, run frames, press keys, read the LCD, send a variable file, and read
 * the keypad back. CEmu itself is compiled unmodified.
 *
 * keypad.c is #included here (and left out of the compile list) so that vertex_key_state() can read the
 * file-static key matrix. That is how the tests check the real emulated keypad without patching CEmu.
 */
#include <emscripten.h>

#include "keypad.c" /* the include path points at CEmu's core/ directory */

#include "asic.h"
#include "emu.h"
#include "lcd.h"
#include "link.h"
#include "mem.h"
#include "os/os.h"
#include "panel.h"
#include "control.h"

#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>

/* ---- Callbacks CEmu expects from its front end ------------------------------------------------------------- */

#define LOG_CAPACITY 4096
static char log_buffer[LOG_CAPACITY];
static size_t log_length;

static void log_append(const char *prefix, const char *format, va_list args) {
    if (log_length + 1 >= LOG_CAPACITY) {
        return; /* keep the first messages: they say why a ROM was rejected */
    }
    int written = snprintf(log_buffer + log_length, LOG_CAPACITY - log_length, "%s", prefix);
    if (written < 0) return;
    log_length += (size_t)written;
    if (log_length + 1 >= LOG_CAPACITY) return;
    written = vsnprintf(log_buffer + log_length, LOG_CAPACITY - log_length, format, args);
    if (written < 0) return;
    log_length += (size_t)written;
    if (log_length >= LOG_CAPACITY) log_length = LOG_CAPACITY - 1;
}

void gui_console_clear(void) {}

void gui_console_printf(const char *format, ...) {
    va_list args;
    va_start(args, format);
    log_append("", format, args);
    va_end(args);
}

void gui_console_err_printf(const char *format, ...) {
    va_list args;
    va_start(args, format);
    log_append("", format, args);
    va_end(args);
}

asic_rev_t gui_handle_reset(const boot_ver_t *boot_ver, asic_rev_t loaded_rev, asic_rev_t default_rev,
                            emu_device_t device, bool *python) {
    (void)boot_ver;
    (void)default_rev;
    (void)device;
    (void)python;
    /* ASIC_REV_AUTO on a fresh ROM boot lets CEmu pick the newest revision the boot code supports. */
    return loaded_rev;
}

FILE *fopen_utf8(const char *filename, const char *mode) {
    return fopen(filename, mode);
}

/* ---- API for the worker ------------------------------------------------------------------------------------ */

static bool emulator_ready;

static void enable_display(void) {
    /* Read the finished panel buffer, and apply the panel's gamma and the backlight level to it. */
    emu_set_lcd_dma(1);
    emu_set_lcd_gamma(1);
}

/* Returns an emu_state_t: 0 valid, 1 invalid, 2 not a CE ROM. Only 0 leaves a running emulator behind. */
EMSCRIPTEN_KEEPALIVE int vertex_load_rom(const char *path) {
    log_length = 0;
    log_buffer[0] = '\0';
    emulator_ready = false;
    emu_state_t state = emu_load(EMU_DATA_ROM, path);
    if (state == EMU_STATE_VALID) {
        enable_display();
        emulator_ready = true;
    } else if (state == EMU_STATE_NOT_A_CE) {
        asic_free(); /* CEmu keeps the ROM loaded in this case, but Vertex refuses it */
    }
    return (int)state;
}

/* Restores a saved image. Returns an emu_state_t as above. */
EMSCRIPTEN_KEEPALIVE int vertex_load_state(const char *path) {
    log_length = 0;
    log_buffer[0] = '\0';
    emulator_ready = false;
    emu_state_t state = emu_load(EMU_DATA_IMAGE, path);
    if (state == EMU_STATE_VALID) {
        enable_display();
        emulator_ready = true;
    }
    return (int)state;
}

/* Writes the whole emulator state to a file. Returns 1 on success. */
EMSCRIPTEN_KEEPALIVE int vertex_save_state(const char *path) {
    return emulator_ready && emu_save(EMU_DATA_IMAGE, path) ? 1 : 0;
}

/* One frame is 1/60 s of emulated time. At the 48 MHz TI-OS clock that is 800,000 CPU cycles. */
EMSCRIPTEN_KEEPALIVE void vertex_run_frames(int frames) {
    if (!emulator_ready) return;
    while (frames-- > 0) {
        emu_run(1u);
    }
}

/* Pointer to the finished 320x240 frame: 76,800 32-bit pixels, row after row, 0xAARRGGBB with the backlight applied. */
EMSCRIPTEN_KEEPALIVE const uint32_t *vertex_frame(void) {
    return &panel.display[0][0];
}

EMSCRIPTEN_KEEPALIVE int vertex_frame_width(void) { return LCD_WIDTH; }
EMSCRIPTEN_KEEPALIVE int vertex_frame_height(void) { return LCD_HEIGHT; }

/* Press or release one key of the 8x8 matrix. (row 2, col 0) is the ON key. */
EMSCRIPTEN_KEEPALIVE void vertex_key(int row, int col, int down) {
    emu_keypad_event((unsigned)row, (unsigned)col, down != 0);
}

/* The currently held keys of one matrix row, one bit per column. The ON key is reported on row 2, bit 0. */
EMSCRIPTEN_KEEPALIVE int vertex_key_state(int row) {
    if (row < 0 || row >= KEYPAD_ACTUAL_ROWS) return 0;
    int bits = keypad_peek_keymap((uint8_t)row);
    if (row == 2 && (atomic_load_explicit(&keypad_atomics.onKey, memory_order_relaxed) & ON_KEY_PRESSED)) {
        bits |= 1;
    }
    return bits;
}

/* Bit 0: emulator running. Bit 1: LCD controller on. Bit 2: calculator switched off (2nd OFF). */
EMSCRIPTEN_KEEPALIVE int vertex_status(void) {
    if (!emulator_ready) return 0;
    int status = 1;
    if (lcd.control & 1u) status |= 2;
    if (control.off) status |= 4;
    return status;
}

/* Text CEmu printed while loading, for error messages. */
EMSCRIPTEN_KEEPALIVE const char *vertex_log(void) {
    return log_buffer;
}

EMSCRIPTEN_KEEPALIVE void vertex_shutdown(void) {
    if (emulator_ready) {
        asic_free();
        emulator_ready = false;
    }
}

/* ---- Variable transfer --------------------------------------------------------------------------------------
 * CEmu emulates a USB host that sends the file, so the emulation has to keep running while the transfer
 * finishes. The worker polls vertex_transfer_state() between frames. */

static int transfer_state; /* 0 idle, 1 sending, 2 finished, -1 failed to start */
static int transfer_value, transfer_total;

/* CEmu reports (value, total) while it sends. When the transfer ends it calls once more: (1, 1) if it worked,
 * (0, 0) if it failed (core/usb/dusb.c, USB_DESTROY_EVENT). */
static bool transfer_progress(void *context, int value, int total) {
    (void)context;
    transfer_value = value;
    transfer_total = total;
    if (value == 0 && total == 0) {
        transfer_state = -1;
    } else if (total > 0 && value >= total && transfer_state == 1) {
        transfer_state = 2;
    }
    return false; /* false means keep going */
}

EMSCRIPTEN_KEEPALIVE int vertex_send_file(const char *path) {
    if (!emulator_ready) return LINK_ERR;
    transfer_value = 0;
    transfer_total = 0;
    transfer_state = 1;
    const char *files[1] = { path };
    int result = emu_send_variables(files, 1, LINK_FILE, transfer_progress, NULL);
    if (result != LINK_GOOD) {
        transfer_state = -1;
    }
    return result;
}

EMSCRIPTEN_KEEPALIVE int vertex_transfer_state(void) { return transfer_state; }
EMSCRIPTEN_KEEPALIVE int vertex_transfer_value(void) { return transfer_value; }
EMSCRIPTEN_KEEPALIVE int vertex_transfer_total(void) { return transfer_total; }
