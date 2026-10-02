import type { Strings } from './types.ts';

export const de: Strings = {
  htmlLang: 'de',
  title: '{brand}: Kostenloser TI-84-Taschenrechner online',
  description:
    'Nutze einen kostenlosen TI-84 Plus CE im Browser. {brand} führt das echte TI-OS auf dem Emulator CEmu aus, mit einer ROM von deinem eigenen Rechner.',
  languageLabel: 'Sprache',
  h1: 'Kostenloser TI-84-Taschenrechner online',
  noticeLead: 'Unabhängige Website.',
  noticeBody:
    '{brand} steht in keiner Verbindung zu Texas Instruments. Die Seite führt den TI-84 Plus CE auf einem Open-Source-Emulator aus.',
  iframeTitle: '{brand}-Taschenrechner',
  about: {
    heading: 'Über {brand}',
    paragraphs: [
      'Willkommen bei {brand}, einem kostenlosen grafikfähigen TI-84 Plus CE, der in deinem Browser läuft. Er nutzt CEmu, einen Open-Source-Emulator, um das echte TI-OS auf emulierter Hardware auszuführen. Du bekommst dieselben Tasten, Menüs und Ergebnisse wie beim Handgerät, auf jedem Gerät und ohne Installation.',
      '{brand} ist für Schülerinnen, Schüler, Lehrkräfte und alle, die einen Grafikrechner für Mathe, Naturwissenschaften, Technik oder Statistik brauchen. Du bringst nur eines mit: eine ROM-Datei von deinem eigenen Rechner. Du lädst sie einmal, und {brand} merkt sie sich.',
    ],
  },
  previewAlt: 'Der {brand}-Taschenrechner',
  features: {
    heading: 'Wichtige Funktionen',
    cards: [
      {
        emoji: '📊',
        title: 'Funktionen zeichnen',
        text: 'Zeichne und analysiere mehrere Funktionen, Parametergleichungen, Polarkurven und Folgen gleichzeitig.',
      },
      {
        emoji: '📈',
        title: 'Statistische Analyse',
        text: 'Berechne Regressionen und Kennwerte und zeichne Diagramme wie Histogramme und Boxplots.',
      },
      {
        emoji: '🔢',
        title: 'Höhere Mathematik',
        text: 'Rechne mit komplexen Zahlen, Matrizen, Listen und mehr.',
      },
      {
        emoji: '💻',
        title: 'Im Browser',
        text: 'Nichts zu installieren. {brand} läuft in deinem Browser auf Computer, Tablet und Smartphone.',
      },
      {
        emoji: '🎯',
        title: 'Echtes TI-OS',
        text: '{brand} führt das echte TI-OS von deinem eigenen Rechner aus. Tasten, Menüs und Ergebnisse entsprechen deshalb dem Handgerät.',
      },
      {
        emoji: '🔧',
        title: 'Zoom-Steuerung',
        text: 'Mache den Rechner mit den Zoom-Tasten größer oder kleiner. {brand} merkt sich deine Einstellung.',
      },
    ],
  },
  how: {
    heading: 'So geht es',
    steps: [
      {
        lead: 'Lade deine ROM einmalig.',
        text: 'Wähle die ROM-Datei von deinem Rechner aus oder ziehe sie auf den Bildschirm. {brand} speichert sie in deinem Browser, du machst das also nur einmal.',
      },
      {
        lead: 'Nutze Maus, Touchscreen oder Tastatur,',
        text: 'um die Tasten des Rechners zu drücken.',
      },
      {
        lead: 'Passe die Größe an',
        text: 'mit der Zoom-Steuerung (+ und -) oben.',
      },
      {
        lead: 'Los geht’s!',
        text: 'Das echte TI-OS läuft, also funktioniert alles wie auf einem echten TI-84 Plus CE. Du kannst auch eine Programmdatei, zum Beispiel eine .8xp, auf den Rechner ziehen, um sie zu senden.',
      },
    ],
  },
  perfect: {
    heading: 'Ideal für',
    items: [
      {
        lead: 'Schülerinnen und Schüler:',
        text: 'Mache Hausaufgaben und übe für Klassenarbeiten am Computer, auch wenn dein Rechner zu Hause liegt.',
      },
      {
        lead: 'Lehrkräfte:',
        text: 'Zeige Rechenschritte im Unterricht per Beamer oder interaktivem Whiteboard.',
      },
      {
        lead: 'Eltern:',
        text: 'Prüfe Hausaufgaben mit demselben Rechner, den dein Kind in der Schule benutzt.',
      },
      {
        lead: 'Berufstätige:',
        text: 'Rechne und zeichne schnell Graphen für Projekte bei der Arbeit.',
      },
    ],
  },
  supported: {
    heading: 'Unterstützte Funktionen',
    intro:
      '{brand} führt das echte TI-OS aus und unterstützt deshalb die Funktionen des TI-84 Plus CE, darunter:',
    items: [
      'Grundrechenarten',
      'Trigonometrische Funktionen (sin, cos, tan und Umkehrfunktionen)',
      'Logarithmus- und Exponentialfunktionen',
      'Matrizenrechnung',
      'Rechnen mit komplexen Zahlen',
      'Statistische Berechnungen und Verteilungen',
      'Graphen mit Zoom und Trace',
      'Programmieren in TI-BASIC',
      'Listenoperationen',
      'Wertetabellen',
      'Programm- und Variablendateien, die du vom Computer sendest',
    ],
  },
  requirements: {
    heading: 'Systemanforderungen',
    intro: '{brand} läuft auf jedem Gerät mit:',
    items: [
      'Einem aktuellen Webbrowser (Chrome, Firefox, Safari, Edge)',
      'Einer Internetverbindung für das erste Laden',
      'Aktiviertem JavaScript und WebAssembly',
      'Einer ROM-Datei von deinem eigenen TI-84 Plus CE ({brand} liefert keine mit)',
    ],
    compat: 'Läuft in aktuellen Browsern unter Windows, macOS, Linux, iOS, Android und Chrome OS.',
  },
  cta: {
    heading: 'Bereit zum Start?',
    text: 'Scrolle nach oben, um den Rechner zu benutzen!',
    button: 'Zurück zum Rechner ↑',
  },
  footer: {
    disclaimerLead: 'Hinweis:',
    disclaimer:
      '{brand} ist eine unabhängige Website. Sie steht in keiner Verbindung zu Texas Instruments und wird von dem Unternehmen nicht unterstützt.',
    emulation: 'Emulation durch {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Quellcode herunterladen',
    trademark:
      'TI-84 Plus CE ist eine Marke von Texas Instruments. Diese Website steht in keiner Verbindung zu Texas Instruments und wird von dem Unternehmen nicht unterstützt.',
    openSourceLead: 'Open Source:',
    openSource:
      '{brand} ist Open Source und liegt auf {github}. Melde Probleme, hilf mit oder erstelle einen Fork.',
    githubLink: 'GitHub',
    privacy: 'Datenschutzerklärung',
    terms: 'Nutzungsbedingungen',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Datenschutzerklärung',
    description: 'Was {brand} speichert, wo es bleibt und wie du es löschst.',
    intro:
      '{brand} sammelt keine Daten von dir. Diese Seite erklärt, was die Website in deinem Browser speichert und was sie nicht tut.',
    updated: 'Zuletzt aktualisiert: 2. Oktober 2026',
    sections: [
      {
        heading: 'Was in deinem Browser bleibt',
        paragraphs: [
          'Deine Rechner-ROM, der gespeicherte Zustand des Rechners und deine Einstellungen, zum Beispiel die Zoomstufe, bleiben in deinem Browser. {brand} speichert sie mit IndexedDB und localStorage. Sie verlassen dein Gerät nie.',
          '{brand} hat keine Upload-Funktion. Es gibt auf keinem Server eine Kopie deiner ROM oder deines gespeicherten Zustands.',
        ],
      },
      {
        heading: 'Was {brand} nicht tut',
        paragraphs: [
          '{brand} hat keine Konten, keine Werbung, keine Analyse, keine Cookies und kein Tracking. Es lädt keine Skripte, Schriften oder Bilder von anderen Websites.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          '{brand} ist eine statische Website. Das Unternehmen, das die Dateien hostet, kann übliche Server-Protokolle führen, etwa mit IP-Adressen und Anfragezeiten. {brand} erhält und nutzt diese Protokolle nicht.',
        ],
      },
      {
        heading: 'Deine Daten löschen',
        paragraphs: [
          'Öffne den Rechner, wähle ROM wechseln und dann Entfernen. Das löscht die ROM und den gespeicherten Zustand. Du kannst auch die Daten dieser Website in den Browsereinstellungen löschen.',
        ],
      },
      {
        heading: 'Änderungen',
        paragraphs: [
          'Wenn sich diese Erklärung ändert, erscheint die neue Fassung mit neuem Datum auf dieser Seite.',
        ],
      },
      {
        heading: 'Fragen',
        paragraphs: ['Eröffne ein Issue auf {github}, wenn du eine Frage zu dieser Erklärung hast.'],
      },
    ],
  },
  terms: {
    title: 'Nutzungsbedingungen',
    description: 'Die Regeln für die Nutzung von {brand}.',
    intro: 'Mit der Nutzung von {brand} stimmst du diesen Bedingungen zu. Sie sind kurz und klar.',
    updated: 'Zuletzt aktualisiert: 2. Oktober 2026',
    sections: [
      {
        heading: '{brand} nutzen',
        paragraphs: [
          '{brand} ist kostenlos für private, schulische und berufliche Zwecke. Nutze es nicht, um anderen zu schaden oder gegen Gesetze zu verstoßen.',
        ],
      },
      {
        heading: 'Ein unabhängiges Projekt',
        paragraphs: [
          '{brand} steht in keiner Verbindung zu Texas Instruments und wird von dem Unternehmen nicht unterstützt. TI-84 Plus CE und TI-OS sind Marken oder Eigentum von Texas Instruments. {brand} nennt diese Namen nur, um zu sagen, was der Emulator ausführt.',
        ],
      },
      {
        heading: 'Deine ROM',
        paragraphs: [
          '{brand} stellt keine ROM-Dateien bereit, hostet sie nicht und verlinkt nicht auf sie. Du brauchst die ROM eines Rechners, der dir gehört, und musst sie selbst auslesen. Teile oder lade keine ROM-Dateien hoch. {brand} behält deine ROM in deinem Browser und sonst nirgends.',
        ],
      },
      {
        heading: 'Open Source',
        paragraphs: [
          '{brand} ist Open Source unter der MIT-Lizenz. Der Emulator ist CEmu und steht unter der GPLv3. Die Fußzeile verlinkt den Quellcode von beiden.',
        ],
      },
      {
        heading: 'Keine Gewährleistung, und Prüfungen',
        paragraphs: [
          '{brand} wird ohne Gewähr bereitgestellt und kann Fehler enthalten. Es ist für keine Prüfung als Rechner zugelassen. Lies deshalb die Prüfungsregeln, bevor du einen Rechner benutzt, auch diesen.',
        ],
      },
      {
        heading: 'Änderungen',
        paragraphs: [
          'Wir können diese Bedingungen ändern. Die aktuelle Fassung steht immer auf dieser Seite.',
        ],
      },
    ],
  },
  legalBack: '← Zurück zu {brand}',
  calc: {
    pageTitle: '{brand}-Taschenrechner',
    screenLabel: 'Bildschirm des Taschenrechners',
    keypadLabel: 'Tastenfeld des Taschenrechners',
    zoomOut: 'Verkleinern',
    zoomIn: 'Vergrößern',
    zoomLabel: 'Zoomstufe',
    romHeading: 'Lade deine TI-84 Plus CE ROM',
    romDrop: 'Ziehe deine ROM-Datei hierher. Sie verlässt nie deinen Browser.',
    romChoose: 'ROM-Datei wählen',
    romHint: 'Erstelle eine ROM von deinem eigenen Rechner mit dem {link}.',
    romHintLink: 'ROM-Dump-Assistenten in CEmu',
    replace: 'Ersetzen',
    remove: 'Entfernen',
    cancel: 'Abbrechen',
    changeRom: 'ROM wechseln',
    checking: 'Deine ROM wird geprüft…',
    starting: 'Dein Rechner startet…',
    loading: 'Der Emulator wird geladen…',
    notice: 'Unabhängige Website. Keine Verbindung zu Texas Instruments.',
    errors: {
      empty: 'Diese Datei ist leer.',
      tooLarge: 'Diese Datei ist zu groß für eine Rechner-ROM.',
      invalid: 'Diese Datei ist keine TI-84 Plus CE ROM.',
      notCE: 'Diese Datei ist keine TI-84 Plus CE ROM.',
      unavailable: 'Der Emulator konnte nicht starten. Lade die Seite neu und versuche es erneut.',
      storage: 'Dein Browser hat die ROM nicht gespeichert. Du musst sie beim nächsten Mal erneut laden.',
      crashed: 'Der Emulator wurde angehalten. Lade die Seite neu, um ihn zu starten.',
      unreadable: 'Dein Browser konnte diese Datei nicht lesen.',
    },
    transfer: {
      sending: '{name} wird gesendet…',
      sent: '{name} gesendet',
      failed: '{name} konnte nicht gesendet werden. Gehe zum Startbildschirm und versuche es erneut.',
      unsupported: '{brand} kann {name} nicht senden.',
      notRunning: 'Lade eine ROM, bevor du Dateien sendest.',
    },
  },
};
