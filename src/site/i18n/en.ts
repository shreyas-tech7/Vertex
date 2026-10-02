import type { Strings } from './types.ts';

export const en: Strings = {
  htmlLang: 'en',
  title: '{brand}: Ad-Free TI-84 Calculator Online',
  description:
    'Use an ad-free TI-84 Plus CE calculator in your browser. {brand} runs the real TI-OS on the CEmu emulator with a ROM from your own calculator.',
  languageLabel: 'Language',
  h1: 'Ad-Free TI-84 Calculator Online',
  noticeLead: 'Independent website.',
  noticeBody:
    '{brand} is not affiliated with Texas Instruments. It runs the TI-84 Plus CE on an open source emulator.',
  iframeTitle: '{brand} calculator',
  about: {
    heading: 'About {brand}',
    paragraphs: [
      'Welcome to {brand}, an ad-free TI-84 Plus CE graphing calculator that runs in your browser. It uses CEmu, an open source emulator, to run the real TI-OS on emulated hardware. You get the same keys, menus, and results as the handheld, on any device, with nothing to install.',
      '{brand} is for students, teachers, and anyone who needs a graphing calculator for math, science, engineering, or statistics. You bring one thing: a ROM file from your own calculator. You load it once and {brand} remembers it.',
    ],
  },
  previewAlt: 'The {brand} calculator',
  features: {
    heading: 'Key Features',
    cards: [
      {
        emoji: '📊',
        title: 'Graphing Functions',
        text: 'Plot and analyze several functions, parametric equations, polar graphs, and sequences at the same time.',
      },
      {
        emoji: '📈',
        title: 'Statistical Analysis',
        text: 'Run regressions, calculate statistics, and draw plots such as histograms and box plots.',
      },
      {
        emoji: '🔢',
        title: 'Advanced Math',
        text: 'Work with complex numbers, matrices, lists, and more.',
      },
      {
        emoji: '💻',
        title: 'Web-Based',
        text: 'Nothing to install. {brand} runs in your browser on a computer, tablet, or phone.',
      },
      {
        emoji: '🎯',
        title: 'Real TI-OS',
        text: '{brand} runs the actual TI-OS from your own calculator, so the keys, menus, and results match the handheld.',
      },
      {
        emoji: '🔧',
        title: 'Zoom Controls',
        text: 'Make the calculator bigger or smaller with the zoom buttons. {brand} remembers your choice.',
      },
    ],
  },
  how: {
    heading: 'How to Use',
    steps: [
      {
        lead: 'Load your ROM once.',
        text: 'Choose the ROM file from your own calculator, or drop it on the screen. {brand} keeps it in your browser, so you only do this one time.',
      },
      {
        lead: 'Use your mouse, touchscreen, or keyboard',
        text: 'to press the calculator buttons.',
      },
      {
        lead: 'Adjust the size',
        text: 'with the zoom controls (+ and -) at the top.',
      },
      {
        lead: 'Start calculating!',
        text: 'The real TI-OS runs, so everything works like a physical TI-84 Plus CE. You can also drop a program file, such as a .8xp, onto the calculator to send it.',
      },
    ],
  },
  perfect: {
    heading: 'Perfect For',
    items: [
      {
        lead: 'Students:',
        text: 'Do homework and practice for tests on a computer, even when your handheld is at home.',
      },
      {
        lead: 'Teachers:',
        text: 'Show calculator steps on a projector or interactive whiteboard during lessons.',
      },
      {
        lead: 'Parents:',
        text: 'Check homework with the same calculator your child uses at school.',
      },
      {
        lead: 'Professionals:',
        text: 'Run quick calculations and graphs for work projects.',
      },
    ],
  },
  supported: {
    heading: 'Supported Functions',
    intro: '{brand} runs the real TI-OS, so it supports the functions of the TI-84 Plus CE, including:',
    items: [
      'Basic arithmetic operations',
      'Trigonometric functions (sin, cos, tan, and inverses)',
      'Logarithmic and exponential functions',
      'Matrix operations',
      'Complex number calculations',
      'Statistical calculations and distributions',
      'Graphing with zoom and trace',
      'Programming in TI-BASIC',
      'List operations',
      'Table generation',
      'Program and variable files sent from your computer',
    ],
  },
  requirements: {
    heading: 'System Requirements',
    intro: '{brand} works on any device with:',
    items: [
      'A modern web browser (Chrome, Firefox, Safari, Edge)',
      'An internet connection for the first load',
      'JavaScript and WebAssembly turned on',
      'A ROM file from your own TI-84 Plus CE calculator ({brand} does not provide one)',
    ],
    compat: 'Works in current browsers on Windows, macOS, Linux, iOS, Android, and Chrome OS.',
  },
  cta: {
    heading: 'Ready to Get Started?',
    text: 'Scroll back to the top to use the calculator!',
    button: 'Back to Calculator ↑',
  },
  footer: {
    disclaimerLead: 'Disclaimer:',
    disclaimer:
      '{brand} is an independent website. It is not affiliated with or endorsed by Texas Instruments.',
    emulation: 'Emulation by {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Get the source code',
    trademark:
      'TI-84 Plus CE is a trademark of Texas Instruments. This website is not affiliated with or endorsed by Texas Instruments.',
    openSourceLead: 'Open Source:',
    openSource: '{brand} is open source and lives on {github}. Report issues, contribute, or fork it.',
    githubLink: 'GitHub',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'What {brand} stores, where it stays, and how to delete it.',
    intro:
      '{brand} does not collect your data. This page explains what the site keeps in your browser and what it does not do.',
    updated: 'Last updated: October 2, 2026',
    sections: [
      {
        heading: 'What stays in your browser',
        paragraphs: [
          'Your calculator ROM, the saved state of the calculator, and your settings, such as the zoom level, stay in your browser. {brand} stores them with IndexedDB and localStorage. They never leave your device.',
          '{brand} has no upload feature. It keeps no copy of your ROM or your saved state on any server.',
        ],
      },
      {
        heading: 'What {brand} does not do',
        paragraphs: [
          '{brand} has no accounts, no ads, no analytics, no cookies, and no tracking. It loads no scripts, fonts, or images from other websites.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          '{brand} is a static website. The company that hosts the files may keep standard server logs, such as IP addresses and request times. {brand} does not receive or use these logs.',
        ],
      },
      {
        heading: 'Delete your data',
        paragraphs: [
          'Open the calculator, choose Change ROM, then Remove. This deletes the ROM and the saved state. You can also clear this site’s data in your browser settings.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: ['If this policy changes, the new version will appear on this page with a new date.'],
      },
      {
        heading: 'Questions',
        paragraphs: ['Open an issue on {github} if you have a question about this policy.'],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    description: 'The rules for using {brand}.',
    intro: 'By using {brand}, you agree to these terms. They are short and plain.',
    updated: 'Last updated: October 2, 2026',
    sections: [
      {
        heading: 'Using {brand}',
        paragraphs: [
          '{brand} has no ads. You can use it for personal, school, and work purposes. Do not use it to harm others or to break the law.',
        ],
      },
      {
        heading: 'An independent project',
        paragraphs: [
          '{brand} is not affiliated with or endorsed by Texas Instruments. TI-84 Plus CE and TI-OS are trademarks or property of Texas Instruments. {brand} uses these names only to say what the emulator runs.',
        ],
      },
      {
        heading: 'Your ROM',
        paragraphs: [
          '{brand} does not provide, host, or link to ROM files. You need a ROM from a calculator you own, and you must dump it yourself. Do not share or upload ROM files. {brand} keeps your ROM in your browser and nowhere else.',
        ],
      },
      {
        heading: 'Open source',
        paragraphs: [
          '{brand} is open source under the MIT license. The emulator is CEmu, which uses the GPLv3 license. The footer links to the source code for both.',
        ],
      },
      {
        heading: 'No warranty, and exams',
        paragraphs: [
          '{brand} comes as is, with no warranty. It can contain bugs. It is not an approved calculator for any exam, so check your exam rules before you use any calculator, including this one.',
        ],
      },
      {
        heading: 'Changes',
        paragraphs: ['We may change these terms. The current version is always on this page.'],
      },
    ],
  },
  legalBack: '← Back to {brand}',
  calc: {
    pageTitle: '{brand} Calculator',
    screenLabel: 'Calculator screen',
    keypadLabel: 'Calculator keypad',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomLabel: 'Zoom level',
    romHeading: 'Load your TI-84 Plus CE ROM',
    romDrop: 'Drop your ROM file here. It never leaves your browser.',
    romChoose: 'Choose ROM file',
    romHint: 'Make a ROM from your own calculator with the {link}.',
    romHintLink: 'ROM dump wizard in CEmu',
    replace: 'Replace',
    remove: 'Remove',
    cancel: 'Cancel',
    changeRom: 'Change ROM',
    checking: 'Checking your ROM…',
    starting: 'Starting your calculator…',
    loading: 'Loading the emulator…',
    notice: 'Independent website. Not affiliated with Texas Instruments.',
    errors: {
      empty: 'That file is empty.',
      tooLarge: 'That file is too big to be a calculator ROM.',
      invalid: 'That file is not a TI-84 Plus CE ROM.',
      notCE: 'That file is not a TI-84 Plus CE ROM.',
      unavailable: 'The emulator could not start. Reload the page and try again.',
      storage: 'Your browser would not store the ROM, so you will need to load it again next time.',
      crashed: 'The emulator stopped. Reload the page to restart it.',
      unreadable: 'Your browser could not read that file.',
    },
    transfer: {
      sending: 'Sending {name}…',
      sent: 'Sent {name}',
      failed: 'Could not send {name}. Go to the home screen and try again.',
      unsupported: '{name} is not a file {brand} can send.',
      notRunning: 'Load a ROM before you send files.',
    },
  },
};
