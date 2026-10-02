import type { Strings } from './types.ts';

export const sv: Strings = {
  htmlLang: 'sv',
  title: '{brand}: reklamfri TI-84-räknare online',
  description:
    'Använd en reklamfri TI-84 Plus CE-räknare i webbläsaren. {brand} kör det riktiga TI-OS i emulatorn CEmu, med en ROM från din egen räknare.',
  languageLabel: 'Språk',
  h1: 'Reklamfri TI-84-räknare online',
  noticeLead: 'Oberoende webbplats.',
  noticeBody:
    '{brand} har ingen koppling till Texas Instruments. Webbplatsen kör TI-84 Plus CE i en emulator med öppen källkod.',
  iframeTitle: '{brand}-räknare',
  about: {
    heading: 'Om {brand}',
    paragraphs: [
      '{brand} är en reklamfri TI-84 Plus CE i din webbläsare. CEmu kör det riktiga TI-OS, så knappar, menyer och resultat är desamma som på handenheten.',
      '{brand} är till för elever, lärare och alla som behöver en grafräknare till matte, naturvetenskap, teknik eller statistik. Du behöver bara ta med en sak: en ROM-fil från din egen räknare. Du laddar den en gång och {brand} kommer ihåg den.',
    ],
  },
  previewAlt: '{brand}-räknaren',
  features: {
    heading: 'Viktiga funktioner',
    cards: [
      {
        emoji: '📊',
        title: 'Rita funktioner',
        text: 'Rita och analysera flera funktioner, parameterekvationer, polära grafer och följder samtidigt.',
      },
      {
        emoji: '📈',
        title: 'Statistisk analys',
        text: 'Gör regressioner, räkna ut statistik och rita diagram som histogram och lådagram.',
      },
      {
        emoji: '🔢',
        title: 'Avancerad matematik',
        text: 'Arbeta med komplexa tal, matriser, listor och mycket mer.',
      },
      {
        emoji: '💻',
        title: 'I webbläsaren',
        text: 'Inget att installera. {brand} körs i din webbläsare på dator, surfplatta eller telefon.',
      },
      {
        emoji: '🎯',
        title: 'Riktigt TI-OS',
        text: '{brand} kör det riktiga TI-OS från din egen räknare, så knappar, menyer och resultat är desamma som på handenheten.',
      },
      {
        emoji: '🔧',
        title: 'Zoomkontroller',
        text: 'Gör räknaren större eller mindre med zoomknapparna. {brand} kommer ihåg ditt val.',
      },
    ],
  },
  how: {
    heading: 'Så här gör du',
    steps: [
      {
        lead: 'Ladda din ROM en enda gång.',
        text: 'Välj ROM-filen från din egen räknare eller släpp den på skärmen. {brand} sparar den i din webbläsare, så du gör det bara en gång.',
      },
      {
        lead: 'Använd musen, pekskärmen eller tangentbordet',
        text: 'för att trycka på räknarens knappar.',
      },
      {
        lead: 'Ändra storleken',
        text: 'med zoomkontrollerna (+ och -) högst upp.',
      },
      {
        lead: 'Börja räkna!',
        text: 'Det riktiga TI-OS körs, så allt fungerar som på en riktig TI-84 Plus CE. Du kan också släppa en programfil, till exempel en .8xp, på räknaren för att skicka den.',
      },
    ],
  },
  perfect: {
    heading: 'Perfekt för',
    items: [
      {
        lead: 'Elever:',
        text: 'gör läxorna och öva inför prov på datorn, även när din räknare ligger hemma.',
      },
      {
        lead: 'Lärare:',
        text: 'visa räknestegen med en projektor eller en interaktiv skrivtavla under lektionerna.',
      },
      {
        lead: 'Föräldrar:',
        text: 'kontrollera läxorna med samma räknare som ditt barn använder i skolan.',
      },
      {
        lead: 'Yrkesverksamma:',
        text: 'gör snabba beräkningar och grafer till jobbprojekt.',
      },
    ],
  },
  supported: {
    heading: 'Funktioner som stöds',
    intro: '{brand} kör det riktiga TI-OS och stöder därför funktionerna i TI-84 Plus CE, bland annat:',
    items: [
      'Grundläggande räkneoperationer',
      'Trigonometriska funktioner (sin, cos, tan och inverser)',
      'Logaritm- och exponentialfunktioner',
      'Matrisberäkningar',
      'Beräkningar med komplexa tal',
      'Statistiska beräkningar och fördelningar',
      'Grafer med zoom och trace',
      'Programmering i TI-BASIC',
      'Listoperationer',
      'Värdetabeller',
      'Program- och variabelfiler som du skickar från datorn',
    ],
  },
  requirements: {
    heading: 'Systemkrav',
    intro: '{brand} fungerar på alla enheter med:',
    items: [
      'En modern webbläsare (Chrome, Firefox, Safari, Edge)',
      'Internetanslutning vid första laddningen',
      'JavaScript och WebAssembly aktiverade',
      'En ROM-fil från din egen TI-84 Plus CE-räknare ({brand} tillhandahåller ingen)',
    ],
    compat: 'Fungerar i aktuella webbläsare på Windows, macOS, Linux, iOS, Android och Chrome OS.',
  },
  cta: {
    heading: 'Redo att börja?',
    text: 'Scrolla tillbaka till toppen för att använda räknaren!',
    button: 'Tillbaka till räknaren ↑',
  },
  footer: {
    disclaimerLead: 'Ansvarsfriskrivning:',
    disclaimer:
      '{brand} är en oberoende webbplats. Den har ingen koppling till Texas Instruments och stöds inte av företaget.',
    emulation: 'Emulering av {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Hämta källkoden',
    trademark:
      'TI-84 Plus CE är ett varumärke som tillhör Texas Instruments. Den här webbplatsen har ingen koppling till Texas Instruments och stöds inte av företaget.',
    openSourceLead: 'Öppen källkod:',
    openSource:
      '{brand} har öppen källkod och finns på {github}. Rapportera problem, bidra eller skapa en fork.',
    githubLink: 'GitHub',
    privacy: 'Integritetspolicy',
    terms: 'Användarvillkor',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Integritetspolicy',
    description: 'Vad {brand} sparar, var det finns kvar och hur du tar bort det.',
    intro:
      '{brand} samlar inte in dina data. Den här sidan förklarar vad webbplatsen sparar i din webbläsare och vad den inte gör.',
    updated: 'Senast uppdaterad: 2 oktober 2026',
    sections: [
      {
        heading: 'Det som stannar i din webbläsare',
        paragraphs: [
          'Din räknares ROM, räknarens sparade tillstånd och dina inställningar, till exempel zoomnivån, stannar i din webbläsare. {brand} lagrar dem med IndexedDB och localStorage. De lämnar aldrig din enhet.',
          '{brand} har ingen uppladdningsfunktion. Webbplatsen sparar ingen kopia av din ROM eller ditt sparade tillstånd på någon server.',
        ],
      },
      {
        heading: 'Vad {brand} inte gör',
        paragraphs: [
          '{brand} har inga konton, ingen reklam, ingen analys, inga cookies och ingen spårning. Webbplatsen laddar inga skript, typsnitt eller bilder från andra webbplatser.',
        ],
      },
      {
        heading: 'Webbhotell',
        paragraphs: [
          '{brand} är en statisk webbplats. Företaget som lagrar filerna kan spara vanliga serverloggar, till exempel IP-adresser och tidpunkter för förfrågningar. {brand} får inte dessa loggar och använder dem inte.',
        ],
      },
      {
        heading: 'Ta bort dina data',
        paragraphs: [
          'Öppna räknaren, välj Byt ROM och sedan Ta bort. Då raderas ROM och sparat tillstånd. Du kan också rensa webbplatsens data i webbläsarens inställningar.',
        ],
      },
      {
        heading: 'Ändringar',
        paragraphs: ['Om policyn ändras visas den nya versionen på den här sidan med ett nytt datum.'],
      },
      {
        heading: 'Frågor',
        paragraphs: ['Skapa ett ärende på {github} om du har en fråga om policyn.'],
      },
    ],
  },
  terms: {
    title: 'Användarvillkor',
    description: 'Reglerna för att använda {brand}.',
    intro: 'När du använder {brand} godkänner du de här villkoren. De är korta och enkla.',
    updated: 'Senast uppdaterad: 2 oktober 2026',
    sections: [
      {
        heading: 'Använda {brand}',
        paragraphs: [
          '{brand} har ingen reklam. Du kan använda det privat, i skolan och på jobbet. Använd det inte för att skada andra eller bryta mot lagen.',
        ],
      },
      {
        heading: 'Ett oberoende projekt',
        paragraphs: [
          '{brand} har ingen koppling till Texas Instruments och stöds inte av företaget. TI-84 Plus CE och TI-OS är varumärken eller egendom som tillhör Texas Instruments. {brand} använder namnen bara för att säga vad emulatorn kör.',
        ],
      },
      {
        heading: 'Din ROM',
        paragraphs: [
          '{brand} tillhandahåller inga ROM-filer, lagrar inga och länkar inte till några. Du behöver ROM från en räknare som du äger, och du måste hämta ut den själv. Dela eller ladda inte upp ROM-filer. {brand} håller din ROM i din webbläsare och ingen annanstans.',
        ],
      },
      {
        heading: 'Öppen källkod',
        paragraphs: [
          '{brand} har öppen källkod under MIT-licensen. Emulatorn är CEmu, som använder GPLv3-licensen. Sidfoten länkar till källkoden för båda.',
        ],
      },
      {
        heading: 'Ingen garanti, och prov',
        paragraphs: [
          '{brand} tillhandahålls i befintligt skick, utan garanti. Det kan innehålla fel. Det är ingen godkänd räknare för något prov, så kontrollera provreglerna innan du använder en räknare, även den här.',
        ],
      },
      {
        heading: 'Ändringar',
        paragraphs: ['Vi kan ändra de här villkoren. Den gällande versionen finns alltid på den här sidan.'],
      },
    ],
  },
  legalBack: '← Tillbaka till {brand}',
  calc: {
    pageTitle: '{brand}-räknare',
    screenLabel: 'Räknarens skärm',
    keypadLabel: 'Räknarens knappsats',
    zoomOut: 'Zooma ut',
    zoomIn: 'Zooma in',
    zoomLabel: 'Zoomnivå',
    romHeading: 'Ladda din TI-84 Plus CE-ROM',
    romDrop: 'Släpp din ROM-fil här. Den lämnar aldrig din webbläsare.',
    romChoose: 'Välj ROM-fil',
    romHint: 'Skapa en ROM från din egen räknare med {link}.',
    romHintLink: 'ROM-dumpguiden i CEmu',
    replace: 'Ersätt',
    remove: 'Ta bort',
    cancel: 'Avbryt',
    changeRom: 'Byt ROM',
    checking: 'Kontrollerar din ROM…',
    starting: 'Startar din räknare…',
    loading: 'Laddar emulatorn…',
    notice: 'Oberoende webbplats. Ingen koppling till Texas Instruments.',
    errors: {
      empty: 'Filen är tom.',
      tooLarge: 'Filen är för stor för att vara en räknar-ROM.',
      invalid: 'Filen är ingen TI-84 Plus CE-ROM.',
      notCE: 'Filen är ingen TI-84 Plus CE-ROM.',
      unavailable: 'Emulatorn kunde inte starta. Ladda om sidan och försök igen.',
      storage: 'Din webbläsare sparade inte ROM, så du måste ladda den igen nästa gång.',
      crashed: 'Emulatorn stannade. Ladda om sidan för att starta den igen.',
      unreadable: 'Din webbläsare kunde inte läsa filen.',
    },
    transfer: {
      sending: 'Skickar {name}…',
      sent: '{name} skickad',
      failed: 'Det gick inte att skicka {name}. Gå till startskärmen och försök igen.',
      unsupported: '{brand} kan inte skicka {name}.',
      notRunning: 'Ladda en ROM innan du skickar filer.',
    },
  },
};
