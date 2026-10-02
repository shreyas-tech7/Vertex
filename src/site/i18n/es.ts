import type { Strings } from './types.ts';

export const es: Strings = {
  htmlLang: 'es',
  title: '{brand}: calculadora TI-84 gratis en línea',
  description:
    'Usa una calculadora TI-84 Plus CE gratis en tu navegador. {brand} ejecuta el TI-OS real en el emulador CEmu, con una ROM de tu propia calculadora.',
  languageLabel: 'Idioma',
  h1: 'Calculadora TI-84 gratis en línea',
  noticeLead: 'Sitio web independiente.',
  noticeBody:
    '{brand} no está afiliado a Texas Instruments. Ejecuta la TI-84 Plus CE en un emulador de código abierto.',
  iframeTitle: 'Calculadora {brand}',
  about: {
    heading: 'Acerca de {brand}',
    paragraphs: [
      'Te damos la bienvenida a {brand}, una calculadora gráfica TI-84 Plus CE gratuita que funciona en tu navegador. Usa CEmu, un emulador de código abierto, para ejecutar el TI-OS real en un hardware emulado. Tienes las mismas teclas, los mismos menús y los mismos resultados que en la calculadora física, en cualquier dispositivo y sin instalar nada.',
      '{brand} es para estudiantes, docentes y cualquiera que necesite una calculadora gráfica para matemáticas, ciencias, ingeniería o estadística. Tú aportas una sola cosa: un archivo ROM de tu propia calculadora. Lo cargas una vez y {brand} lo recuerda.',
    ],
  },
  previewAlt: 'La calculadora {brand}',
  features: {
    heading: 'Funciones principales',
    cards: [
      {
        emoji: '📊',
        title: 'Gráficas de funciones',
        text: 'Dibuja y analiza varias funciones, ecuaciones paramétricas, gráficas polares y sucesiones al mismo tiempo.',
      },
      {
        emoji: '📈',
        title: 'Análisis estadístico',
        text: 'Calcula regresiones y estadísticas, y dibuja gráficos como histogramas y diagramas de caja.',
      },
      {
        emoji: '🔢',
        title: 'Matemáticas avanzadas',
        text: 'Trabaja con números complejos, matrices, listas y mucho más.',
      },
      {
        emoji: '💻',
        title: 'En el navegador',
        text: 'No hay nada que instalar. {brand} funciona en tu navegador, en ordenador, tableta o teléfono.',
      },
      {
        emoji: '🎯',
        title: 'TI-OS real',
        text: '{brand} ejecuta el TI-OS real de tu propia calculadora, así que las teclas, los menús y los resultados son los del aparato.',
      },
      {
        emoji: '🔧',
        title: 'Controles de zoom',
        text: 'Haz la calculadora más grande o más pequeña con los botones de zoom. {brand} recuerda tu elección.',
      },
    ],
  },
  how: {
    heading: 'Cómo se usa',
    steps: [
      {
        lead: 'Carga tu ROM una sola vez.',
        text: 'Elige el archivo ROM de tu calculadora o suéltalo en la pantalla. {brand} lo guarda en tu navegador, así que solo lo haces una vez.',
      },
      {
        lead: 'Usa el ratón, la pantalla táctil o el teclado',
        text: 'para pulsar las teclas de la calculadora.',
      },
      {
        lead: 'Ajusta el tamaño',
        text: 'con los controles de zoom (+ y -) de arriba.',
      },
      {
        lead: '¡Empieza a calcular!',
        text: 'El TI-OS real se ejecuta, así que todo funciona como en una TI-84 Plus CE física. También puedes soltar un archivo de programa, como un .8xp, sobre la calculadora para enviarlo.',
      },
    ],
  },
  perfect: {
    heading: 'Ideal para',
    items: [
      {
        lead: 'Estudiantes:',
        text: 'haz los deberes y practica para los exámenes en el ordenador, aunque tu calculadora esté en casa.',
      },
      {
        lead: 'Docentes:',
        text: 'muestra los pasos de cálculo con un proyector o una pizarra interactiva durante las clases.',
      },
      {
        lead: 'Padres y madres:',
        text: 'revisa los deberes con la misma calculadora que usa tu hijo o hija en el colegio.',
      },
      {
        lead: 'Profesionales:',
        text: 'haz cálculos y gráficas rápidas para tus proyectos de trabajo.',
      },
    ],
  },
  supported: {
    heading: 'Funciones compatibles',
    intro: '{brand} ejecuta el TI-OS real, así que admite las funciones de la TI-84 Plus CE, entre ellas:',
    items: [
      'Operaciones aritméticas básicas',
      'Funciones trigonométricas (sin, cos, tan y sus inversas)',
      'Funciones logarítmicas y exponenciales',
      'Operaciones con matrices',
      'Cálculos con números complejos',
      'Cálculos estadísticos y distribuciones',
      'Gráficas con zoom y trace',
      'Programación en TI-BASIC',
      'Operaciones con listas',
      'Tablas de valores',
      'Archivos de programas y variables enviados desde tu ordenador',
    ],
  },
  requirements: {
    heading: 'Requisitos del sistema',
    intro: '{brand} funciona en cualquier dispositivo que tenga:',
    items: [
      'Un navegador web moderno (Chrome, Firefox, Safari, Edge)',
      'Conexión a internet para la primera carga',
      'JavaScript y WebAssembly activados',
      'Un archivo ROM de tu propia calculadora TI-84 Plus CE ({brand} no incluye ninguno)',
    ],
    compat: 'Funciona en los navegadores actuales de Windows, macOS, Linux, iOS, Android y Chrome OS.',
  },
  cta: {
    heading: '¿Listo para empezar?',
    text: '¡Vuelve arriba para usar la calculadora!',
    button: 'Volver a la calculadora ↑',
  },
  footer: {
    disclaimerLead: 'Aviso:',
    disclaimer:
      '{brand} es un sitio web independiente. No está afiliado a Texas Instruments ni cuenta con su aprobación.',
    emulation: 'Emulación de {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Obtener el código fuente',
    trademark:
      'TI-84 Plus CE es una marca de Texas Instruments. Este sitio web no está afiliado a Texas Instruments ni cuenta con su aprobación.',
    openSourceLead: 'Código abierto:',
    openSource:
      '{brand} es de código abierto y está en {github}. Informa de problemas, colabora o crea un fork.',
    githubLink: 'GitHub',
    privacy: 'Política de privacidad',
    terms: 'Términos del servicio',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Política de privacidad',
    description: 'Qué guarda {brand}, dónde se queda y cómo borrarlo.',
    intro:
      '{brand} no recoge tus datos. Esta página explica qué guarda el sitio en tu navegador y qué no hace.',
    updated: 'Última actualización: 2 de octubre de 2026',
    sections: [
      {
        heading: 'Lo que se queda en tu navegador',
        paragraphs: [
          'La ROM de tu calculadora, el estado guardado de la calculadora y tus ajustes, como el nivel de zoom, se quedan en tu navegador. {brand} los guarda con IndexedDB y localStorage. Nunca salen de tu dispositivo.',
          '{brand} no tiene función de subida. No guarda en ningún servidor una copia de tu ROM ni de tu estado guardado.',
        ],
      },
      {
        heading: 'Lo que {brand} no hace',
        paragraphs: [
          '{brand} no tiene cuentas, anuncios, analíticas, cookies ni seguimiento. No carga scripts, fuentes ni imágenes de otros sitios web.',
        ],
      },
      {
        heading: 'Alojamiento',
        paragraphs: [
          '{brand} es un sitio estático. La empresa que aloja los archivos puede guardar registros de servidor habituales, como direcciones IP y horas de las solicitudes. {brand} no recibe ni usa esos registros.',
        ],
      },
      {
        heading: 'Borra tus datos',
        paragraphs: [
          'Abre la calculadora, elige Cambiar ROM y luego Quitar. Eso borra la ROM y el estado guardado. También puedes borrar los datos de este sitio en los ajustes de tu navegador.',
        ],
      },
      {
        heading: 'Cambios',
        paragraphs: [
          'Si esta política cambia, la nueva versión aparecerá en esta página con una fecha nueva.',
        ],
      },
      {
        heading: 'Preguntas',
        paragraphs: ['Abre una incidencia en {github} si tienes una pregunta sobre esta política.'],
      },
    ],
  },
  terms: {
    title: 'Términos del servicio',
    description: 'Las reglas para usar {brand}.',
    intro: 'Al usar {brand}, aceptas estos términos. Son cortos y claros.',
    updated: 'Última actualización: 2 de octubre de 2026',
    sections: [
      {
        heading: 'Usar {brand}',
        paragraphs: [
          '{brand} es gratuito para uso personal, escolar y laboral. No lo uses para hacer daño a otras personas ni para infringir la ley.',
        ],
      },
      {
        heading: 'Un proyecto independiente',
        paragraphs: [
          '{brand} no está afiliado a Texas Instruments ni cuenta con su aprobación. TI-84 Plus CE y TI-OS son marcas o propiedad de Texas Instruments. {brand} usa estos nombres solo para decir qué ejecuta el emulador.',
        ],
      },
      {
        heading: 'Tu ROM',
        paragraphs: [
          '{brand} no proporciona archivos ROM, no los aloja y no enlaza a ellos. Necesitas la ROM de una calculadora que sea tuya, y debes extraerla tú mismo. No compartas ni subas archivos ROM. {brand} guarda tu ROM en tu navegador y en ningún otro sitio.',
        ],
      },
      {
        heading: 'Código abierto',
        paragraphs: [
          '{brand} es de código abierto con licencia MIT. El emulador es CEmu, que usa la licencia GPLv3. El pie de página enlaza al código fuente de ambos.',
        ],
      },
      {
        heading: 'Sin garantía, y exámenes',
        paragraphs: [
          '{brand} se ofrece tal cual, sin garantía. Puede contener errores. No es una calculadora aprobada para ningún examen, así que consulta las normas de tu examen antes de usar cualquier calculadora, incluida esta.',
        ],
      },
      {
        heading: 'Cambios',
        paragraphs: ['Podemos cambiar estos términos. La versión actual siempre está en esta página.'],
      },
    ],
  },
  legalBack: '← Volver a {brand}',
  calc: {
    pageTitle: 'Calculadora {brand}',
    screenLabel: 'Pantalla de la calculadora',
    keypadLabel: 'Teclado de la calculadora',
    zoomOut: 'Reducir',
    zoomIn: 'Ampliar',
    zoomLabel: 'Nivel de zoom',
    romHeading: 'Carga tu ROM de la TI-84 Plus CE',
    romDrop: 'Suelta aquí tu archivo ROM. Nunca sale de tu navegador.',
    romChoose: 'Elegir archivo ROM',
    romHint: 'Crea una ROM de tu propia calculadora con el {link}.',
    romHintLink: 'asistente de volcado de ROM de CEmu',
    replace: 'Reemplazar',
    remove: 'Quitar',
    cancel: 'Cancelar',
    changeRom: 'Cambiar ROM',
    checking: 'Comprobando tu ROM…',
    starting: 'Iniciando tu calculadora…',
    loading: 'Cargando el emulador…',
    notice: 'Sitio web independiente. No afiliado a Texas Instruments.',
    errors: {
      empty: 'Ese archivo está vacío.',
      tooLarge: 'Ese archivo es demasiado grande para ser una ROM de calculadora.',
      invalid: 'Ese archivo no es una ROM de la TI-84 Plus CE.',
      notCE: 'Ese archivo no es una ROM de la TI-84 Plus CE.',
      unavailable: 'El emulador no pudo iniciarse. Recarga la página e inténtalo de nuevo.',
      storage: 'Tu navegador no guardó la ROM, así que tendrás que cargarla de nuevo la próxima vez.',
      crashed: 'El emulador se detuvo. Recarga la página para reiniciarlo.',
      unreadable: 'Tu navegador no pudo leer ese archivo.',
    },
    transfer: {
      sending: 'Enviando {name}…',
      sent: '{name} enviado',
      failed: 'No se pudo enviar {name}. Ve a la pantalla de inicio e inténtalo de nuevo.',
      unsupported: '{brand} no puede enviar {name}.',
      notRunning: 'Carga una ROM antes de enviar archivos.',
    },
  },
};
