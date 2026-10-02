import type { Strings } from './types.ts';

export const fr: Strings = {
  htmlLang: 'fr',
  title: '{brand} : calculatrice TI-84 sans publicité en ligne',
  description:
    'Utilisez une calculatrice TI-84 Plus CE sans publicité dans votre navigateur. {brand} fait tourner le vrai TI-OS sur l’émulateur CEmu, avec une ROM issue de votre propre calculatrice.',
  languageLabel: 'Langue',
  h1: 'Calculatrice TI-84 sans publicité en ligne',
  noticeLead: 'Site indépendant.',
  noticeBody:
    '{brand} n’est pas affilié à Texas Instruments. Il fait tourner la TI-84 Plus CE sur un émulateur open source.',
  iframeTitle: 'Calculatrice {brand}',
  about: {
    heading: 'À propos de {brand}',
    paragraphs: [
      'Bienvenue sur {brand}, une calculatrice graphique TI-84 Plus CE sans publicité qui fonctionne dans votre navigateur. Elle utilise CEmu, un émulateur open source, pour faire tourner le vrai TI-OS sur un matériel émulé. Vous retrouvez les mêmes touches, les mêmes menus et les mêmes résultats que sur la calculatrice, sur n’importe quel appareil, sans rien installer.',
      '{brand} s’adresse aux élèves, aux étudiants, aux enseignants et à toute personne qui a besoin d’une calculatrice graphique pour les maths, les sciences, l’ingénierie ou les statistiques. Vous apportez une seule chose : un fichier ROM de votre propre calculatrice. Vous le chargez une fois et {brand} s’en souvient.',
    ],
  },
  previewAlt: 'La calculatrice {brand}',
  features: {
    heading: 'Fonctionnalités principales',
    cards: [
      {
        emoji: '📊',
        title: 'Tracé de fonctions',
        text: 'Tracez et analysez plusieurs fonctions, équations paramétriques, courbes polaires et suites en même temps.',
      },
      {
        emoji: '📈',
        title: 'Analyse statistique',
        text: 'Calculez des régressions et des statistiques, et dessinez des graphiques comme les histogrammes et les boîtes à moustaches.',
      },
      {
        emoji: '🔢',
        title: 'Maths avancées',
        text: 'Travaillez avec des nombres complexes, des matrices, des listes et bien plus.',
      },
      {
        emoji: '💻',
        title: 'Dans le navigateur',
        text: 'Rien à installer. {brand} fonctionne dans votre navigateur, sur ordinateur, tablette ou téléphone.',
      },
      {
        emoji: '🎯',
        title: 'Le vrai TI-OS',
        text: '{brand} exécute le vrai TI-OS de votre propre calculatrice. Les touches, les menus et les résultats sont donc ceux de la calculatrice.',
      },
      {
        emoji: '🔧',
        title: 'Commandes de zoom',
        text: 'Agrandissez ou réduisez la calculatrice avec les boutons de zoom. {brand} retient votre choix.',
      },
    ],
  },
  how: {
    heading: 'Mode d’emploi',
    steps: [
      {
        lead: 'Chargez votre ROM une seule fois.',
        text: 'Choisissez le fichier ROM de votre calculatrice, ou déposez-le sur l’écran. {brand} le garde dans votre navigateur, vous ne le faites donc qu’une fois.',
      },
      {
        lead: 'Utilisez la souris, l’écran tactile ou le clavier',
        text: 'pour appuyer sur les touches de la calculatrice.',
      },
      {
        lead: 'Réglez la taille',
        text: 'avec les commandes de zoom (+ et -) en haut.',
      },
      {
        lead: 'Calculez !',
        text: 'Le vrai TI-OS tourne, donc tout fonctionne comme sur une vraie TI-84 Plus CE. Vous pouvez aussi déposer un fichier de programme, comme un .8xp, sur la calculatrice pour l’envoyer.',
      },
    ],
  },
  perfect: {
    heading: 'Idéal pour',
    items: [
      {
        lead: 'Les élèves :',
        text: 'faites vos devoirs et préparez vos contrôles sur ordinateur, même quand votre calculatrice est restée à la maison.',
      },
      {
        lead: 'Les enseignants :',
        text: 'montrez les étapes de calcul sur un projecteur ou un tableau interactif pendant vos cours.',
      },
      {
        lead: 'Les parents :',
        text: 'vérifiez les devoirs avec la même calculatrice que celle de votre enfant à l’école.',
      },
      {
        lead: 'Les professionnels :',
        text: 'faites des calculs et des graphiques rapides pour vos projets.',
      },
    ],
  },
  supported: {
    heading: 'Fonctions prises en charge',
    intro:
      '{brand} exécute le vrai TI-OS, il prend donc en charge les fonctions de la TI-84 Plus CE, notamment :',
    items: [
      'Opérations arithmétiques de base',
      'Fonctions trigonométriques (sin, cos, tan et leurs réciproques)',
      'Fonctions logarithmiques et exponentielles',
      'Calcul matriciel',
      'Calculs avec des nombres complexes',
      'Calculs statistiques et lois de probabilité',
      'Tracé de graphiques avec zoom et trace',
      'Programmation en TI-BASIC',
      'Opérations sur les listes',
      'Tables de valeurs',
      'Fichiers de programmes et de variables envoyés depuis votre ordinateur',
    ],
  },
  requirements: {
    heading: 'Configuration requise',
    intro: '{brand} fonctionne sur tout appareil équipé de :',
    items: [
      'Un navigateur web récent (Chrome, Firefox, Safari, Edge)',
      'Une connexion internet pour le premier chargement',
      'JavaScript et WebAssembly activés',
      'Un fichier ROM de votre propre calculatrice TI-84 Plus CE ({brand} n’en fournit pas)',
    ],
    compat: 'Fonctionne dans les navigateurs récents sous Windows, macOS, Linux, iOS, Android et Chrome OS.',
  },
  cta: {
    heading: 'Prêt à commencer ?',
    text: 'Remontez en haut de la page pour utiliser la calculatrice !',
    button: 'Retour à la calculatrice ↑',
  },
  footer: {
    disclaimerLead: 'Avertissement :',
    disclaimer:
      '{brand} est un site indépendant. Il n’est ni affilié à Texas Instruments ni approuvé par cette société.',
    emulation: 'Émulation par {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Obtenir le code source',
    trademark:
      'TI-84 Plus CE est une marque de Texas Instruments. Ce site n’est ni affilié à Texas Instruments ni approuvé par cette société.',
    openSourceLead: 'Open source :',
    openSource:
      '{brand} est open source et se trouve sur {github}. Signalez des problèmes, contribuez ou faites-en un fork.',
    githubLink: 'GitHub',
    privacy: 'Politique de confidentialité',
    terms: 'Conditions d’utilisation',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Ce que {brand} enregistre, où cela reste et comment le supprimer.',
    intro:
      '{brand} ne collecte pas vos données. Cette page explique ce que le site garde dans votre navigateur et ce qu’il ne fait pas.',
    updated: 'Dernière mise à jour : 2 octobre 2026',
    sections: [
      {
        heading: 'Ce qui reste dans votre navigateur',
        paragraphs: [
          'La ROM de votre calculatrice, l’état enregistré de la calculatrice et vos réglages, comme le niveau de zoom, restent dans votre navigateur. {brand} les stocke avec IndexedDB et localStorage. Ils ne quittent jamais votre appareil.',
          '{brand} n’a aucune fonction d’envoi. Il ne garde aucune copie de votre ROM ni de votre état enregistré sur un serveur.',
        ],
      },
      {
        heading: 'Ce que {brand} ne fait pas',
        paragraphs: [
          '{brand} n’a ni compte, ni publicité, ni outil d’analyse, ni cookie, ni suivi. Il ne charge aucun script, aucune police et aucune image depuis d’autres sites.',
        ],
      },
      {
        heading: 'Hébergement',
        paragraphs: [
          '{brand} est un site statique. La société qui héberge les fichiers peut conserver des journaux de serveur classiques, comme les adresses IP et les heures de requête. {brand} ne reçoit pas ces journaux et ne les utilise pas.',
        ],
      },
      {
        heading: 'Supprimer vos données',
        paragraphs: [
          'Ouvrez la calculatrice, choisissez Changer de ROM, puis Supprimer. Cela efface la ROM et l’état enregistré. Vous pouvez aussi effacer les données de ce site dans les réglages de votre navigateur.',
        ],
      },
      {
        heading: 'Modifications',
        paragraphs: [
          'Si cette politique change, la nouvelle version apparaîtra sur cette page avec une nouvelle date.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: ['Ouvrez un ticket sur {github} si vous avez une question sur cette politique.'],
      },
    ],
  },
  terms: {
    title: 'Conditions d’utilisation',
    description: 'Les règles d’utilisation de {brand}.',
    intro: 'En utilisant {brand}, vous acceptez ces conditions. Elles sont courtes et simples.',
    updated: 'Dernière mise à jour : 2 octobre 2026',
    sections: [
      {
        heading: 'Utiliser {brand}',
        paragraphs: [
          '{brand} ne contient aucune publicité. Vous pouvez l’utiliser pour un usage personnel, scolaire et professionnel. Ne l’utilisez pas pour nuire à autrui ni pour enfreindre la loi.',
        ],
      },
      {
        heading: 'Un projet indépendant',
        paragraphs: [
          '{brand} n’est ni affilié à Texas Instruments ni approuvé par cette société. TI-84 Plus CE et TI-OS sont des marques ou des biens de Texas Instruments. {brand} emploie ces noms uniquement pour dire ce que l’émulateur exécute.',
        ],
      },
      {
        heading: 'Votre ROM',
        paragraphs: [
          '{brand} ne fournit pas de fichiers ROM, ne les héberge pas et ne renvoie pas vers eux. Il vous faut la ROM d’une calculatrice que vous possédez, et vous devez l’extraire vous-même. Ne partagez pas et n’envoyez pas de fichiers ROM. {brand} garde votre ROM dans votre navigateur et nulle part ailleurs.',
        ],
      },
      {
        heading: 'Open source',
        paragraphs: [
          '{brand} est open source sous licence MIT. L’émulateur est CEmu, sous licence GPLv3. Le pied de page renvoie vers le code source des deux.',
        ],
      },
      {
        heading: 'Aucune garantie, et les examens',
        paragraphs: [
          '{brand} est fourni tel quel, sans garantie. Il peut contenir des bogues. Ce n’est pas une calculatrice autorisée pour un examen. Vérifiez donc le règlement de votre examen avant d’utiliser une calculatrice, y compris celle-ci.',
        ],
      },
      {
        heading: 'Modifications',
        paragraphs: [
          'Nous pouvons modifier ces conditions. La version en vigueur se trouve toujours sur cette page.',
        ],
      },
    ],
  },
  legalBack: '← Retour à {brand}',
  calc: {
    pageTitle: 'Calculatrice {brand}',
    screenLabel: 'Écran de la calculatrice',
    keypadLabel: 'Clavier de la calculatrice',
    zoomOut: 'Réduire',
    zoomIn: 'Agrandir',
    zoomLabel: 'Niveau de zoom',
    romHeading: 'Chargez votre ROM TI-84 Plus CE',
    romDrop: 'Déposez votre fichier ROM ici. Il ne quitte jamais votre navigateur.',
    romChoose: 'Choisir un fichier ROM',
    romHint: 'Créez une ROM à partir de votre calculatrice avec l’{link}.',
    romHintLink: 'assistant d’extraction de ROM de CEmu',
    replace: 'Remplacer',
    remove: 'Supprimer',
    cancel: 'Annuler',
    changeRom: 'Changer de ROM',
    checking: 'Vérification de votre ROM…',
    starting: 'Démarrage de votre calculatrice…',
    loading: 'Chargement de l’émulateur…',
    notice: 'Site indépendant. Non affilié à Texas Instruments.',
    errors: {
      empty: 'Ce fichier est vide.',
      tooLarge: 'Ce fichier est trop gros pour être une ROM de calculatrice.',
      invalid: 'Ce fichier n’est pas une ROM TI-84 Plus CE.',
      notCE: 'Ce fichier n’est pas une ROM TI-84 Plus CE.',
      unavailable: 'L’émulateur n’a pas pu démarrer. Rechargez la page et réessayez.',
      storage:
        'Votre navigateur a refusé de stocker la ROM. Vous devrez la charger de nouveau la prochaine fois.',
      crashed: 'L’émulateur s’est arrêté. Rechargez la page pour le relancer.',
      unreadable: 'Votre navigateur n’a pas pu lire ce fichier.',
    },
    transfer: {
      sending: 'Envoi de {name}…',
      sent: '{name} envoyé',
      failed: 'Impossible d’envoyer {name}. Revenez à l’écran d’accueil et réessayez.',
      unsupported: '{brand} ne peut pas envoyer {name}.',
      notRunning: 'Chargez une ROM avant d’envoyer des fichiers.',
    },
  },
};
