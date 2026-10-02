import type { Strings } from './types.ts';

export const ja: Strings = {
  htmlLang: 'ja',
  title: '{brand}：広告なしのTI-84電卓をオンラインで',
  description:
    'ブラウザで広告なしのTI-84 Plus CE電卓を使えます。{brand}は、お手持ちの電卓から取り出したROMを使い、エミュレーターCEmu上で本物のTI-OSを動かします。',
  languageLabel: '言語',
  h1: '広告なしのTI-84電卓をオンラインで',
  noticeLead: '独立したウェブサイトです。',
  noticeBody:
    '{brand}はTexas Instrumentsとは関係がありません。オープンソースのエミュレーターでTI-84 Plus CEを動かします。',
  iframeTitle: '{brand}電卓',
  about: {
    heading: '{brand}について',
    paragraphs: [
      '{brand}へようこそ。ブラウザで動く広告なしのTI-84 Plus CEグラフ電卓です。オープンソースのエミュレーターCEmuを使い、エミュレートしたハードウェア上で本物のTI-OSを動かします。キーもメニューも結果も実機と同じで、どの端末でも、インストールなしで使えます。',
      '{brand}は、数学、理科、工学、統計のためにグラフ電卓が必要な学生、教師、そのほかすべての方に向けたものです。必要なのは、ご自身の電卓から取り出したROMファイルだけです。一度読み込めば、{brand}が覚えています。',
    ],
  },
  previewAlt: '{brand}電卓',
  features: {
    heading: '主な機能',
    cards: [
      {
        emoji: '📊',
        title: '関数のグラフ',
        text: '複数の関数、媒介変数方程式、極座標のグラフ、数列を同時に描いて分析できます。',
      },
      {
        emoji: '📈',
        title: '統計分析',
        text: '回帰分析や統計量の計算ができ、ヒストグラムや箱ひげ図などのプロットも描けます。',
      },
      {
        emoji: '🔢',
        title: '高度な数学',
        text: '複素数、行列、リストなどを扱えます。',
      },
      {
        emoji: '💻',
        title: 'ウェブ版',
        text: 'インストールは不要です。{brand}は、パソコン、タブレット、スマートフォンのブラウザで動きます。',
      },
      {
        emoji: '🎯',
        title: '本物のTI-OS',
        text: '{brand}は、お手持ちの電卓の本物のTI-OSを動かします。そのため、キー、メニュー、結果は実機と同じです。',
      },
      {
        emoji: '🔧',
        title: 'ズーム操作',
        text: 'ズームボタンで電卓を大きくも小さくもできます。{brand}は選んだ大きさを覚えています。',
      },
    ],
  },
  how: {
    heading: '使い方',
    steps: [
      {
        lead: 'ROMを一度だけ読み込みます。',
        text: 'ご自身の電卓のROMファイルを選ぶか、画面にドロップしてください。{brand}はブラウザ内に保存するので、読み込みは一度で済みます。',
      },
      {
        lead: 'マウス、タッチ画面、キーボードで',
        text: '電卓のボタンを押します。',
      },
      {
        lead: 'サイズを調整します。',
        text: '上にあるズーム操作（+と-）を使います。',
      },
      {
        lead: '計算を始めましょう。',
        text: '本物のTI-OSが動くので、実際のTI-84 Plus CEと同じように使えます。.8xpなどのプログラムファイルを電卓にドロップして送ることもできます。',
      },
    ],
  },
  perfect: {
    heading: 'こんな方におすすめ',
    items: [
      {
        lead: '学生：',
        text: '電卓が家にあるときでも、パソコンで宿題をしたりテスト勉強をしたりできます。',
      },
      {
        lead: '教師：',
        text: '授業中、プロジェクターや電子黒板で計算の手順を見せられます。',
      },
      {
        lead: '保護者：',
        text: 'お子さんが学校で使うのと同じ電卓で、宿題を確認できます。',
      },
      {
        lead: '社会人：',
        text: '仕事のプロジェクトで、手早く計算したりグラフを描いたりできます。',
      },
    ],
  },
  supported: {
    heading: '対応する機能',
    intro: '{brand}は本物のTI-OSを動かすので、TI-84 Plus CEの機能に対応しています。たとえば次のとおりです。',
    items: [
      '基本的な四則演算',
      '三角関数（sin、cos、tan、およびその逆関数）',
      '対数関数と指数関数',
      '行列の計算',
      '複素数の計算',
      '統計計算と確率分布',
      'ズームとトレースを使ったグラフ表示',
      'TI-BASICによるプログラミング',
      'リスト演算',
      '数表の作成',
      'パソコンから送るプログラムファイルと変数ファイル',
    ],
  },
  requirements: {
    heading: '動作環境',
    intro: '{brand}は、次のものがあればどの端末でも動きます。',
    items: [
      '最新のウェブブラウザ（Chrome、Firefox、Safari、Edge）',
      '初回の読み込みに使うインターネット接続',
      'JavaScriptとWebAssemblyが有効であること',
      'ご自身のTI-84 Plus CE電卓から取り出したROMファイル（{brand}では提供していません）',
    ],
    compat: 'Windows、macOS、Linux、iOS、Android、Chrome OSの最新ブラウザで動きます。',
  },
  cta: {
    heading: '始める準備はできましたか？',
    text: 'ページの一番上に戻って、電卓を使いましょう。',
    button: '電卓に戻る ↑',
  },
  footer: {
    disclaimerLead: '免責事項：',
    disclaimer:
      '{brand}は独立したウェブサイトです。Texas Instrumentsとは関係がなく、同社の承認も受けていません。',
    emulation: 'エミュレーション：{cemu}（GPLv3）。{source}',
    cemuLink: 'CEmu',
    sourceLink: 'ソースコードを入手',
    trademark:
      'TI-84 Plus CEはTexas Instrumentsの商標です。このウェブサイトはTexas Instrumentsとは関係がなく、同社の承認も受けていません。',
    openSourceLead: 'オープンソース：',
    openSource: '{brand}はオープンソースで、{github}で公開しています。問題の報告、貢献、フォークは自由です。',
    githubLink: 'GitHub',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    copyright: '© 2026 {brand}.',
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: '{brand}が保存するもの、その保存場所、削除の方法をご説明します。',
    intro:
      '{brand}はあなたのデータを集めません。このページでは、サイトがブラウザに保存するものと、しないことを説明します。',
    updated: '最終更新日：2026年10月2日',
    sections: [
      {
        heading: 'ブラウザに残るもの',
        paragraphs: [
          '電卓のROM、保存した電卓の状態、ズームの大きさなどの設定は、ブラウザ内に残ります。{brand}はIndexedDBとlocalStorageに保存します。これらがお使いの端末の外に出ることはありません。',
          '{brand}にはアップロード機能がありません。ROMや保存した状態のコピーを、どのサーバーにも残しません。',
        ],
      },
      {
        heading: '{brand}がしないこと',
        paragraphs: [
          '{brand}には、アカウント、広告、アクセス解析、クッキー、追跡がありません。ほかのウェブサイトからスクリプト、フォント、画像を読み込むこともありません。',
        ],
      },
      {
        heading: 'ホスティング',
        paragraphs: [
          '{brand}は静的なウェブサイトです。ファイルをホストする会社は、IPアドレスやリクエストの時刻など、標準的なサーバーログを保管する場合があります。{brand}はこのログを受け取らず、使うこともありません。',
        ],
      },
      {
        heading: 'データの削除',
        paragraphs: [
          '電卓を開き、「ROMを変更」を選んでから「削除」を選びます。ROMと保存した状態が消えます。ブラウザの設定で、このサイトのデータを消去することもできます。',
        ],
      },
      {
        heading: '変更について',
        paragraphs: ['このポリシーが変わった場合は、新しい日付とともに、新しい版をこのページに掲載します。'],
      },
      {
        heading: 'お問い合わせ',
        paragraphs: ['このポリシーについて質問がある場合は、{github}でイシューを作成してください。'],
      },
    ],
  },
  terms: {
    title: '利用規約',
    description: '{brand}を使うときのルールです。',
    intro: '{brand}を使うことで、この規約に同意したものとみなします。短く、わかりやすくまとめています。',
    updated: '最終更新日：2026年10月2日',
    sections: [
      {
        heading: '{brand}の利用',
        paragraphs: [
          '{brand}には広告がありません。個人、学校、仕事のどの目的でも使えます。他人を傷つけたり法律に違反したりするために使わないでください。',
        ],
      },
      {
        heading: '独立したプロジェクト',
        paragraphs: [
          '{brand}はTexas Instrumentsとは関係がなく、同社の承認も受けていません。TI-84 Plus CEとTI-OSは、Texas Instrumentsの商標または財産です。{brand}がこれらの名前を使うのは、エミュレーターが何を動かすかを伝えるためだけです。',
        ],
      },
      {
        heading: 'ROMについて',
        paragraphs: [
          '{brand}は、ROMファイルを提供せず、ホストせず、リンクもしません。ご自身が所有する電卓のROMが必要で、取り出しもご自身で行ってください。ROMファイルを共有したりアップロードしたりしないでください。{brand}はROMをブラウザ内にだけ保存します。',
        ],
      },
      {
        heading: 'オープンソース',
        paragraphs: [
          '{brand}はMITライセンスのオープンソースです。エミュレーターのCEmuはGPLv3ライセンスです。フッターから両方のソースコードを見られます。',
        ],
      },
      {
        heading: '無保証と試験について',
        paragraphs: [
          '{brand}は現状のまま提供され、いかなる保証もありません。不具合が含まれる場合があります。どの試験でも使用が認められた電卓ではありません。この電卓を含め、電卓を使う前に試験のルールを確認してください。',
        ],
      },
      {
        heading: '変更について',
        paragraphs: ['この規約は変更することがあります。最新版は常にこのページにあります。'],
      },
    ],
  },
  legalBack: '← {brand}に戻る',
  calc: {
    pageTitle: '{brand}電卓',
    screenLabel: '電卓の画面',
    keypadLabel: '電卓のキー',
    zoomOut: '縮小',
    zoomIn: '拡大',
    zoomLabel: 'ズームの大きさ',
    romHeading: 'TI-84 Plus CEのROMを読み込む',
    romDrop: 'ROMファイルをここにドロップしてください。ブラウザの外には出ません。',
    romChoose: 'ROMファイルを選ぶ',
    romHint: 'ご自身の電卓のROMは、{link}で作れます。',
    romHintLink: 'CEmuのROMダンプウィザード',
    replace: '置き換える',
    remove: '削除',
    cancel: 'キャンセル',
    changeRom: 'ROMを変更',
    checking: 'ROMを確認しています…',
    starting: '電卓を起動しています…',
    loading: 'エミュレーターを読み込んでいます…',
    notice: '独立したウェブサイトです。Texas Instrumentsとは関係ありません。',
    errors: {
      empty: 'このファイルは空です。',
      tooLarge: 'このファイルは電卓のROMにしては大きすぎます。',
      invalid: 'このファイルはTI-84 Plus CEのROMではありません。',
      notCE: 'このファイルはTI-84 Plus CEのROMではありません。',
      unavailable: 'エミュレーターを起動できませんでした。ページを再読み込みして、もう一度お試しください。',
      storage: 'ブラウザがROMの保存を許可しませんでした。次回は、もう一度読み込む必要があります。',
      crashed: 'エミュレーターが止まりました。ページを再読み込みして、再開してください。',
      unreadable: 'ブラウザがこのファイルを読み取れませんでした。',
    },
    transfer: {
      sending: '{name}を送信しています…',
      sent: '{name}を送信しました',
      failed: '{name}を送信できませんでした。ホーム画面に戻って、もう一度お試しください。',
      unsupported: '{name}は{brand}で送信できないファイルです。',
      notRunning: 'ファイルを送る前に、ROMを読み込んでください。',
    },
  },
};
