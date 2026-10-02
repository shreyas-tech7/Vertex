import type { Strings } from './types.ts';

export const it: Strings = {
  htmlLang: 'it',
  title: '{brand}: calcolatrice TI-84 gratis online',
  description:
    'Usa gratis una calcolatrice TI-84 Plus CE nel tuo browser. {brand} esegue il vero TI-OS sull’emulatore CEmu, con una ROM della tua calcolatrice.',
  languageLabel: 'Lingua',
  h1: 'Calcolatrice TI-84 gratis online',
  noticeLead: 'Sito indipendente.',
  noticeBody:
    '{brand} non è affiliato a Texas Instruments. Esegue la TI-84 Plus CE su un emulatore open source.',
  iframeTitle: 'Calcolatrice {brand}',
  about: {
    heading: 'Informazioni su {brand}',
    paragraphs: [
      'Benvenuto su {brand}, una calcolatrice grafica TI-84 Plus CE gratuita che funziona nel tuo browser. Usa CEmu, un emulatore open source, per eseguire il vero TI-OS su hardware emulato. Hai gli stessi tasti, gli stessi menu e gli stessi risultati della calcolatrice fisica, su qualsiasi dispositivo e senza installare nulla.',
      '{brand} è pensato per studenti, insegnanti e chiunque abbia bisogno di una calcolatrice grafica per matematica, scienze, ingegneria o statistica. Serve una sola cosa: un file ROM della tua calcolatrice. Lo carichi una volta e {brand} lo ricorda.',
    ],
  },
  previewAlt: 'La calcolatrice {brand}',
  features: {
    heading: 'Funzioni principali',
    cards: [
      {
        emoji: '📊',
        title: 'Grafici di funzioni',
        text: 'Disegna e analizza più funzioni, equazioni parametriche, grafici polari e successioni nello stesso momento.',
      },
      {
        emoji: '📈',
        title: 'Analisi statistica',
        text: 'Calcola regressioni e statistiche e disegna grafici come istogrammi e box plot.',
      },
      {
        emoji: '🔢',
        title: 'Matematica avanzata',
        text: 'Lavora con numeri complessi, matrici, liste e altro ancora.',
      },
      {
        emoji: '💻',
        title: 'Nel browser',
        text: 'Niente da installare. {brand} funziona nel tuo browser su computer, tablet o telefono.',
      },
      {
        emoji: '🎯',
        title: 'Il vero TI-OS',
        text: '{brand} esegue il vero TI-OS della tua calcolatrice, quindi tasti, menu e risultati sono quelli del dispositivo fisico.',
      },
      {
        emoji: '🔧',
        title: 'Controlli dello zoom',
        text: 'Ingrandisci o riduci la calcolatrice con i pulsanti dello zoom. {brand} ricorda la tua scelta.',
      },
    ],
  },
  how: {
    heading: 'Come si usa',
    steps: [
      {
        lead: 'Carica la tua ROM una sola volta.',
        text: 'Scegli il file ROM della tua calcolatrice oppure trascinalo sullo schermo. {brand} lo conserva nel tuo browser, quindi lo fai una volta sola.',
      },
      {
        lead: 'Usa il mouse, il touchscreen o la tastiera',
        text: 'per premere i tasti della calcolatrice.',
      },
      {
        lead: 'Regola la dimensione',
        text: 'con i controlli dello zoom (+ e -) in alto.',
      },
      {
        lead: 'Inizia a calcolare!',
        text: 'Il vero TI-OS è in esecuzione, quindi tutto funziona come su una TI-84 Plus CE fisica. Puoi anche trascinare sulla calcolatrice un file di programma, per esempio un .8xp, per inviarlo.',
      },
    ],
  },
  perfect: {
    heading: 'Ideale per',
    items: [
      {
        lead: 'Studenti:',
        text: 'fai i compiti e preparati ai compiti in classe dal computer, anche quando la tua calcolatrice è a casa.',
      },
      {
        lead: 'Insegnanti:',
        text: 'mostra i passaggi di calcolo con un proiettore o una lavagna interattiva durante le lezioni.',
      },
      {
        lead: 'Genitori:',
        text: 'controlla i compiti con la stessa calcolatrice che usa tuo figlio a scuola.',
      },
      {
        lead: 'Professionisti:',
        text: 'esegui calcoli e grafici veloci per i tuoi progetti di lavoro.',
      },
    ],
  },
  supported: {
    heading: 'Funzioni supportate',
    intro: '{brand} esegue il vero TI-OS, quindi supporta le funzioni della TI-84 Plus CE, tra cui:',
    items: [
      'Operazioni aritmetiche di base',
      'Funzioni trigonometriche (sin, cos, tan e inverse)',
      'Funzioni logaritmiche ed esponenziali',
      'Calcolo matriciale',
      'Calcoli con numeri complessi',
      'Calcoli statistici e distribuzioni',
      'Grafici con zoom e trace',
      'Programmazione in TI-BASIC',
      'Operazioni sulle liste',
      'Tabelle di valori',
      'File di programmi e variabili inviati dal tuo computer',
    ],
  },
  requirements: {
    heading: 'Requisiti di sistema',
    intro: '{brand} funziona su qualsiasi dispositivo con:',
    items: [
      'Un browser web moderno (Chrome, Firefox, Safari, Edge)',
      'Una connessione a internet per il primo caricamento',
      'JavaScript e WebAssembly attivi',
      'Un file ROM della tua calcolatrice TI-84 Plus CE ({brand} non ne fornisce)',
    ],
    compat: 'Funziona nei browser recenti su Windows, macOS, Linux, iOS, Android e Chrome OS.',
  },
  cta: {
    heading: 'Pronto a iniziare?',
    text: 'Torna in cima alla pagina per usare la calcolatrice!',
    button: 'Torna alla calcolatrice ↑',
  },
  footer: {
    disclaimerLead: 'Avvertenza:',
    disclaimer:
      '{brand} è un sito indipendente. Non è affiliato a Texas Instruments né approvato da questa società.',
    emulation: 'Emulazione di {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Scarica il codice sorgente',
    trademark:
      'TI-84 Plus CE è un marchio di Texas Instruments. Questo sito non è affiliato a Texas Instruments né approvato da questa società.',
    openSourceLead: 'Open source:',
    openSource:
      '{brand} è open source e si trova su {github}. Segnala problemi, contribuisci o crea un fork.',
    githubLink: 'GitHub',
    privacy: 'Informativa sulla privacy',
    terms: 'Termini di servizio',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Informativa sulla privacy',
    description: 'Cosa salva {brand}, dove resta e come cancellarlo.',
    intro:
      '{brand} non raccoglie i tuoi dati. Questa pagina spiega cosa il sito conserva nel tuo browser e cosa non fa.',
    updated: 'Ultimo aggiornamento: 2 ottobre 2026',
    sections: [
      {
        heading: 'Cosa resta nel tuo browser',
        paragraphs: [
          'La ROM della tua calcolatrice, lo stato salvato della calcolatrice e le tue impostazioni, come il livello di zoom, restano nel tuo browser. {brand} li salva con IndexedDB e localStorage. Non lasciano mai il tuo dispositivo.',
          '{brand} non ha una funzione di caricamento. Non conserva su nessun server una copia della tua ROM o del tuo stato salvato.',
        ],
      },
      {
        heading: 'Cosa non fa {brand}',
        paragraphs: [
          '{brand} non ha account, pubblicità, strumenti di analisi, cookie né tracciamento. Non carica script, caratteri o immagini da altri siti.',
        ],
      },
      {
        heading: 'Hosting',
        paragraphs: [
          '{brand} è un sito statico. L’azienda che ospita i file può conservare i normali log del server, come gli indirizzi IP e gli orari delle richieste. {brand} non riceve e non usa questi log.',
        ],
      },
      {
        heading: 'Cancella i tuoi dati',
        paragraphs: [
          'Apri la calcolatrice, scegli Cambia ROM e poi Rimuovi. Questo cancella la ROM e lo stato salvato. Puoi anche cancellare i dati di questo sito dalle impostazioni del browser.',
        ],
      },
      {
        heading: 'Modifiche',
        paragraphs: [
          'Se questa informativa cambia, la nuova versione apparirà in questa pagina con una nuova data.',
        ],
      },
      {
        heading: 'Domande',
        paragraphs: ['Apri una segnalazione su {github} se hai una domanda su questa informativa.'],
      },
    ],
  },
  terms: {
    title: 'Termini di servizio',
    description: 'Le regole per usare {brand}.',
    intro: 'Usando {brand}, accetti questi termini. Sono brevi e chiari.',
    updated: 'Ultimo aggiornamento: 2 ottobre 2026',
    sections: [
      {
        heading: 'Usare {brand}',
        paragraphs: [
          '{brand} è gratuito per uso personale, scolastico e di lavoro. Non usarlo per danneggiare altri o per violare la legge.',
        ],
      },
      {
        heading: 'Un progetto indipendente',
        paragraphs: [
          '{brand} non è affiliato a Texas Instruments né approvato da questa società. TI-84 Plus CE e TI-OS sono marchi o proprietà di Texas Instruments. {brand} usa questi nomi solo per dire cosa esegue l’emulatore.',
        ],
      },
      {
        heading: 'La tua ROM',
        paragraphs: [
          '{brand} non fornisce file ROM, non li ospita e non rimanda a essi. Ti serve la ROM di una calcolatrice che possiedi e devi estrarla tu stesso. Non condividere né caricare file ROM. {brand} tiene la tua ROM nel tuo browser e in nessun altro posto.',
        ],
      },
      {
        heading: 'Open source',
        paragraphs: [
          '{brand} è open source con licenza MIT. L’emulatore è CEmu, con licenza GPLv3. Il piè di pagina rimanda al codice sorgente di entrambi.',
        ],
      },
      {
        heading: 'Nessuna garanzia, ed esami',
        paragraphs: [
          '{brand} è fornito così com’è, senza garanzia. Può contenere errori. Non è una calcolatrice approvata per alcun esame, quindi controlla le regole del tuo esame prima di usare una calcolatrice, anche questa.',
        ],
      },
      {
        heading: 'Modifiche',
        paragraphs: ['Possiamo cambiare questi termini. La versione attuale è sempre in questa pagina.'],
      },
    ],
  },
  legalBack: '← Torna a {brand}',
  calc: {
    pageTitle: 'Calcolatrice {brand}',
    screenLabel: 'Schermo della calcolatrice',
    keypadLabel: 'Tastiera della calcolatrice',
    zoomOut: 'Riduci',
    zoomIn: 'Ingrandisci',
    zoomLabel: 'Livello di zoom',
    romHeading: 'Carica la tua ROM TI-84 Plus CE',
    romDrop: 'Trascina qui il tuo file ROM. Non lascia mai il tuo browser.',
    romChoose: 'Scegli file ROM',
    romHint: 'Crea una ROM dalla tua calcolatrice con la {link}.',
    romHintLink: 'procedura guidata di estrazione ROM di CEmu',
    replace: 'Sostituisci',
    remove: 'Rimuovi',
    cancel: 'Annulla',
    changeRom: 'Cambia ROM',
    checking: 'Controllo della ROM in corso…',
    starting: 'Avvio della calcolatrice…',
    loading: 'Caricamento dell’emulatore…',
    notice: 'Sito indipendente. Non affiliato a Texas Instruments.',
    errors: {
      empty: 'Questo file è vuoto.',
      tooLarge: 'Questo file è troppo grande per essere una ROM di calcolatrice.',
      invalid: 'Questo file non è una ROM TI-84 Plus CE.',
      notCE: 'Questo file non è una ROM TI-84 Plus CE.',
      unavailable: 'L’emulatore non è partito. Ricarica la pagina e riprova.',
      storage: 'Il tuo browser non ha salvato la ROM, quindi dovrai caricarla di nuovo la prossima volta.',
      crashed: 'L’emulatore si è fermato. Ricarica la pagina per riavviarlo.',
      unreadable: 'Il tuo browser non è riuscito a leggere questo file.',
    },
    transfer: {
      sending: 'Invio di {name} in corso…',
      sent: '{name} inviato',
      failed: 'Impossibile inviare {name}. Torna alla schermata iniziale e riprova.',
      unsupported: '{brand} non può inviare {name}.',
      notRunning: 'Carica una ROM prima di inviare file.',
    },
  },
};
