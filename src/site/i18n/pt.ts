import type { Strings } from './types.ts';

export const pt: Strings = {
  htmlLang: 'pt',
  title: '{brand}: calculadora TI-84 sem anúncios online',
  description:
    'Use uma calculadora TI-84 Plus CE sem anúncios no seu navegador. O {brand} executa o TI-OS real no emulador CEmu, com uma ROM da sua própria calculadora.',
  languageLabel: 'Idioma',
  h1: 'Calculadora TI-84 sem anúncios online',
  noticeLead: 'Site independente.',
  noticeBody:
    'O {brand} não é afiliado à Texas Instruments. Ele executa a TI-84 Plus CE em um emulador de código aberto.',
  iframeTitle: 'Calculadora {brand}',
  about: {
    heading: 'Sobre o {brand}',
    paragraphs: [
      'O {brand} é uma TI-84 Plus CE sem anúncios no seu navegador. O CEmu executa o TI-OS real, então as teclas, os menus e os resultados são os da calculadora.',
      'O {brand} é para estudantes, professores e qualquer pessoa que precise de uma calculadora gráfica para matemática, ciências, engenharia ou estatística. Você traz uma única coisa: um arquivo ROM da sua própria calculadora. Você o carrega uma vez e o {brand} se lembra dele.',
    ],
  },
  previewAlt: 'A calculadora {brand}',
  features: {
    heading: 'Principais recursos',
    cards: [
      {
        emoji: '📊',
        title: 'Gráficos de funções',
        text: 'Trace e analise várias funções, equações paramétricas, gráficos polares e sequências ao mesmo tempo.',
      },
      {
        emoji: '📈',
        title: 'Análise estatística',
        text: 'Calcule regressões e estatísticas e desenhe gráficos como histogramas e boxplots.',
      },
      {
        emoji: '🔢',
        title: 'Matemática avançada',
        text: 'Trabalhe com números complexos, matrizes, listas e muito mais.',
      },
      {
        emoji: '💻',
        title: 'No navegador',
        text: 'Nada para instalar. O {brand} funciona no seu navegador, em computador, tablet ou celular.',
      },
      {
        emoji: '🎯',
        title: 'TI-OS real',
        text: 'O {brand} executa o TI-OS real da sua própria calculadora, então as teclas, os menus e os resultados são os do aparelho.',
      },
      {
        emoji: '🔧',
        title: 'Controles de zoom',
        text: 'Deixe a calculadora maior ou menor com os botões de zoom. O {brand} lembra da sua escolha.',
      },
    ],
  },
  how: {
    heading: 'Como usar',
    steps: [
      {
        lead: 'Carregue sua ROM uma única vez.',
        text: 'Escolha o arquivo ROM da sua calculadora ou solte-o na tela. O {brand} o guarda no seu navegador, então você faz isso só uma vez.',
      },
      {
        lead: 'Use o mouse, a tela de toque ou o teclado',
        text: 'para apertar as teclas da calculadora.',
      },
      {
        lead: 'Ajuste o tamanho',
        text: 'com os controles de zoom (+ e -) no alto.',
      },
      {
        lead: 'Comece a calcular!',
        text: 'O TI-OS real está em execução, então tudo funciona como em uma TI-84 Plus CE física. Você também pode soltar um arquivo de programa, como um .8xp, sobre a calculadora para enviá-lo.',
      },
    ],
  },
  perfect: {
    heading: 'Ideal para',
    items: [
      {
        lead: 'Estudantes:',
        text: 'faça a lição de casa e treine para as provas no computador, mesmo quando sua calculadora estiver em casa.',
      },
      {
        lead: 'Professores:',
        text: 'mostre os passos do cálculo em um projetor ou lousa interativa durante as aulas.',
      },
      {
        lead: 'Pais:',
        text: 'confira a lição de casa com a mesma calculadora que seu filho usa na escola.',
      },
      {
        lead: 'Profissionais:',
        text: 'faça cálculos e gráficos rápidos para projetos de trabalho.',
      },
    ],
  },
  supported: {
    heading: 'Funções compatíveis',
    intro: 'O {brand} executa o TI-OS real, então ele oferece as funções da TI-84 Plus CE, incluindo:',
    items: [
      'Operações aritméticas básicas',
      'Funções trigonométricas (sin, cos, tan e inversas)',
      'Funções logarítmicas e exponenciais',
      'Operações com matrizes',
      'Cálculos com números complexos',
      'Cálculos estatísticos e distribuições',
      'Gráficos com zoom e trace',
      'Programação em TI-BASIC',
      'Operações com listas',
      'Tabelas de valores',
      'Arquivos de programas e variáveis enviados do seu computador',
    ],
  },
  requirements: {
    heading: 'Requisitos do sistema',
    intro: 'O {brand} funciona em qualquer dispositivo que tenha:',
    items: [
      'Um navegador moderno (Chrome, Firefox, Safari, Edge)',
      'Conexão com a internet no primeiro carregamento',
      'JavaScript e WebAssembly ativados',
      'Um arquivo ROM da sua própria calculadora TI-84 Plus CE (o {brand} não fornece nenhum)',
    ],
    compat: 'Funciona nos navegadores atuais do Windows, macOS, Linux, iOS, Android e Chrome OS.',
  },
  cta: {
    heading: 'Pronto para começar?',
    text: 'Volte ao topo da página para usar a calculadora!',
    button: 'Voltar à calculadora ↑',
  },
  footer: {
    disclaimerLead: 'Aviso:',
    disclaimer:
      'O {brand} é um site independente. Ele não é afiliado à Texas Instruments nem aprovado por ela.',
    emulation: 'Emulação por {cemu} (GPLv3). {source}',
    cemuLink: 'CEmu',
    sourceLink: 'Obter o código-fonte',
    trademark:
      'TI-84 Plus CE é uma marca da Texas Instruments. Este site não é afiliado à Texas Instruments nem aprovado por ela.',
    openSourceLead: 'Código aberto:',
    openSource:
      'O {brand} é de código aberto e fica no {github}. Relate problemas, contribua ou crie um fork.',
    githubLink: 'GitHub',
    privacy: 'Política de privacidade',
    terms: 'Termos de serviço',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'Política de privacidade',
    description: 'O que o {brand} guarda, onde fica e como apagar.',
    intro:
      'O {brand} não coleta seus dados. Esta página explica o que o site guarda no seu navegador e o que ele não faz.',
    updated: 'Última atualização: 2 de outubro de 2026',
    sections: [
      {
        heading: 'O que fica no seu navegador',
        paragraphs: [
          'A ROM da sua calculadora, o estado salvo da calculadora e suas configurações, como o nível de zoom, ficam no seu navegador. O {brand} os guarda com IndexedDB e localStorage. Eles nunca saem do seu dispositivo.',
          'O {brand} não tem recurso de envio. Ele não guarda em nenhum servidor uma cópia da sua ROM nem do seu estado salvo.',
        ],
      },
      {
        heading: 'O que o {brand} não faz',
        paragraphs: [
          'O {brand} não tem contas, anúncios, análises, cookies nem rastreamento. Ele não carrega scripts, fontes ou imagens de outros sites.',
        ],
      },
      {
        heading: 'Hospedagem',
        paragraphs: [
          'O {brand} é um site estático. A empresa que hospeda os arquivos pode guardar registros comuns de servidor, como endereços IP e horários das solicitações. O {brand} não recebe nem usa esses registros.',
        ],
      },
      {
        heading: 'Apague seus dados',
        paragraphs: [
          'Abra a calculadora, escolha Trocar ROM e depois Remover. Isso apaga a ROM e o estado salvo. Você também pode limpar os dados deste site nas configurações do navegador.',
        ],
      },
      {
        heading: 'Mudanças',
        paragraphs: ['Se esta política mudar, a nova versão aparecerá nesta página com uma nova data.'],
      },
      {
        heading: 'Perguntas',
        paragraphs: ['Abra uma issue no {github} se tiver alguma pergunta sobre esta política.'],
      },
    ],
  },
  terms: {
    title: 'Termos de serviço',
    description: 'As regras para usar o {brand}.',
    intro: 'Ao usar o {brand}, você concorda com estes termos. Eles são curtos e claros.',
    updated: 'Última atualização: 2 de outubro de 2026',
    sections: [
      {
        heading: 'Usar o {brand}',
        paragraphs: [
          'O {brand} não tem anúncios. Você pode usá-lo para fins pessoais, escolares e profissionais. Não o use para prejudicar outras pessoas nem para violar a lei.',
        ],
      },
      {
        heading: 'Um projeto independente',
        paragraphs: [
          'O {brand} não é afiliado à Texas Instruments nem aprovado por ela. TI-84 Plus CE e TI-OS são marcas ou propriedade da Texas Instruments. O {brand} usa esses nomes apenas para dizer o que o emulador executa.',
        ],
      },
      {
        heading: 'Sua ROM',
        paragraphs: [
          'O {brand} não fornece arquivos ROM, não os hospeda e não aponta links para eles. Você precisa da ROM de uma calculadora que seja sua e deve extraí-la você mesmo. Não compartilhe nem envie arquivos ROM. O {brand} guarda sua ROM no seu navegador e em nenhum outro lugar.',
        ],
      },
      {
        heading: 'Código aberto',
        paragraphs: [
          'O {brand} é de código aberto sob a licença MIT. O emulador é o CEmu, que usa a licença GPLv3. O rodapé tem links para o código-fonte dos dois.',
        ],
      },
      {
        heading: 'Sem garantia, e provas',
        paragraphs: [
          'O {brand} é oferecido como está, sem garantia. Ele pode ter erros. Não é uma calculadora aprovada para nenhuma prova, então confira as regras da sua prova antes de usar qualquer calculadora, inclusive esta.',
        ],
      },
      {
        heading: 'Mudanças',
        paragraphs: ['Podemos mudar estes termos. A versão atual está sempre nesta página.'],
      },
    ],
  },
  legalBack: '← Voltar ao {brand}',
  calc: {
    pageTitle: 'Calculadora {brand}',
    screenLabel: 'Tela da calculadora',
    keypadLabel: 'Teclado da calculadora',
    zoomOut: 'Diminuir',
    zoomIn: 'Aumentar',
    zoomLabel: 'Nível de zoom',
    romHeading: 'Carregue sua ROM da TI-84 Plus CE',
    romDrop: 'Solte aqui seu arquivo ROM. Ele nunca sai do seu navegador.',
    romChoose: 'Escolher arquivo ROM',
    romHint: 'Crie uma ROM da sua própria calculadora com o {link}.',
    romHintLink: 'assistente de extração de ROM do CEmu',
    replace: 'Substituir',
    remove: 'Remover',
    cancel: 'Cancelar',
    changeRom: 'Trocar ROM',
    checking: 'Verificando sua ROM…',
    starting: 'Iniciando sua calculadora…',
    loading: 'Carregando o emulador…',
    notice: 'Site independente. Sem afiliação à Texas Instruments.',
    errors: {
      empty: 'Esse arquivo está vazio.',
      tooLarge: 'Esse arquivo é grande demais para ser uma ROM de calculadora.',
      invalid: 'Esse arquivo não é uma ROM da TI-84 Plus CE.',
      notCE: 'Esse arquivo não é uma ROM da TI-84 Plus CE.',
      unavailable: 'O emulador não conseguiu iniciar. Recarregue a página e tente de novo.',
      storage: 'Seu navegador não guardou a ROM, então você precisará carregá-la de novo na próxima vez.',
      crashed: 'O emulador parou. Recarregue a página para reiniciá-lo.',
      unreadable: 'Seu navegador não conseguiu ler esse arquivo.',
    },
    transfer: {
      sending: 'Enviando {name}…',
      sent: '{name} enviado',
      failed: 'Não foi possível enviar {name}. Vá para a tela inicial e tente de novo.',
      unsupported: 'O {brand} não pode enviar {name}.',
      notRunning: 'Carregue uma ROM antes de enviar arquivos.',
    },
  },
};
