/**
 * Every string a Vertex page or the calculator can show, in one shape. Each language file must supply all of it, so a
 * missing translation fails the type check. Placeholders in braces are filled in by the page generator:
 * {brand} the product name, {model} the calculator model, {link}/{cemu}/{source}/{github} anchors, {name} a file name.
 */
export const LANGS = ['en', 'fr', 'de', 'ja', 'it', 'es', 'pt', 'sv', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

/** Names in their own language, for the dropdown. */
export const LANG_NAMES: Readonly<Record<Lang, string>> = {
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  it: 'Italiano',
  es: 'Español',
  pt: 'Português',
  sv: 'Svenska',
  ru: 'Русский',
};

export const isLang = (value: string | null | undefined): value is Lang => LANGS.includes(value as Lang);

export interface Card {
  emoji: string;
  title: string;
  text: string;
}

/** A bold lead-in followed by plain text, as in the reference's "How to Use" steps. */
export interface LeadItem {
  lead: string;
  text: string;
}

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  description: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}

/** Text on the calculator page itself (the ROM panel, loading state, messages). */
export interface CalcStrings {
  pageTitle: string;
  screenLabel: string;
  keypadLabel: string;
  zoomOut: string;
  zoomIn: string;
  zoomLabel: string;
  romHeading: string;
  romDrop: string;
  romChoose: string;
  romHint: string;
  romHintLink: string;
  replace: string;
  remove: string;
  cancel: string;
  changeRom: string;
  checking: string;
  starting: string;
  loading: string;
  notice: string;
  errors: {
    empty: string;
    tooLarge: string;
    invalid: string;
    notCE: string;
    unavailable: string;
    storage: string;
    crashed: string;
    unreadable: string;
  };
  transfer: {
    sending: string;
    sent: string;
    failed: string;
    unsupported: string;
    notRunning: string;
  };
}

export interface Strings {
  htmlLang: string;
  title: string;
  description: string;
  languageLabel: string;
  h1: string;
  noticeLead: string;
  noticeBody: string;
  iframeTitle: string;
  about: { heading: string; paragraphs: string[] };
  previewAlt: string;
  features: { heading: string; cards: Card[] };
  how: { heading: string; steps: LeadItem[] };
  perfect: { heading: string; items: LeadItem[] };
  supported: { heading: string; intro: string; items: string[] };
  requirements: { heading: string; intro: string; items: string[]; compat: string };
  cta: { heading: string; text: string; button: string };
  footer: {
    disclaimerLead: string;
    disclaimer: string;
    emulation: string;
    cemuLink: string;
    sourceLink: string;
    trademark: string;
    openSourceLead: string;
    openSource: string;
    githubLink: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
  privacy: LegalDoc;
  terms: LegalDoc;
  legalBack: string;
  calc: CalcStrings;
}
