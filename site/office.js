/* ============================================================
   PixelYen ライブオフィス — みなとみらい・最上階ペントハウス(本店)
   第3次大改修:
   ・時間帯連動の昼夜サイクル(朝/昼/夕/夜・JST・2秒フェード・
     window.__officeTimeOverride で検証可・手動プレビューボタン付)
   ・2フロア化: RF「ルーフトップ・スカイラウンジ」新設
     (インフィニティプール/ファイヤーピット/スカイバー/ヘリポート/
      エレベーター演出・社員が時々RFへ休憩に行く=常時2〜4名程度)
   ・質感: 磨いた床の鏡面反射(キャラ)・着席表現・歩行ロール・
     大理石受付・真鍮ディテール・会議室/KPIモニターに実データ投影
   ・詳細: 社員パネルに「最近の仕事」(本物のgitコミット)フィード
   素のJS/SVG/CSSのみ。dashboard.json / offices.json 取得失敗時は
   全員「勤務中」のデフォルト演出にフォールバックする。
   ドラッグ/スワイプ/←→でパン、+/− でズーム(8色縛り解除 #012)。
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('live-office');
  if (!root) return;

  /* ---------- 定数(シーン論理座標: 7100 x 1100) ----------
     左端に社長室(OWNER_W=700)を増設。既存レイアウト(6400幅)は
     まるごと +700 シフトして再利用する。 */
  var OWNER_W = 700;
  var VW = 6400 + OWNER_W, VH = 1100;
  /* 夜景(パララックス遠景)の論理幅と追従率 */
  var FAR_W = 4800, PARALLAX = 0.3;

  /* 社員マスタ(scripts/employees.json + agents/*.md の性格ひとこと) */
  var EMPLOYEES = [
    { slug: 'rei',      name: 'レイ',     role: 'CEO',                  dept: '経営',       blurb: '冷静な戦略家。口癖は「それは利益に繋がるか?」' },
    { slug: 'matome',   name: 'マトメ',   role: '番頭',                 dept: '経営',       blurb: '気配りの達人。要点しか言わない。' },
    { slug: 'hirameki', name: 'ヒラメキ', role: '新規事業',             dept: '経営',       blurb: '会議で一人だけ変なことを言う担当。「全員一致」への防波堤。' },
    { slug: 'kataribe', name: 'カタリベ', role: '社史編纂',             dept: '経営',       blurb: '静かな観察者。数字の裏のドラマを拾う。' },
    { slug: 'mame',     name: 'マメ',     role: 'CS',                   dept: '経営',       blurb: '律儀で丁寧。値引き交渉には絶対に応じない。' },
    { slug: 'tsukuru',  name: 'ツクル',   role: 'プロダクト部長/開発',  dept: 'プロダクト', blurb: '寡黙な職人。「動くものを早く出す」が信条。' },
    { slug: 'iroha',    name: 'イロハ',   role: 'デザイン',             dept: 'プロダクト', blurb: '美意識は高いが「売れるデザイン>賞を取るデザイン」。' },
    { slug: 'mekiki',   name: 'メキキ',   role: '品質管理',             dept: 'プロダクト', blurb: '厳しいが、直し方まで必ず添える。' },
    { slug: 'tsuzuri',  name: 'ツヅリ',   role: 'ライター',             dept: 'プロダクト', blurb: '締切を守る職業作家。1文字も無駄にしない。' },
    { slug: 'kaketsu',  name: 'カケツ',   role: '障害対応',             dept: 'プロダクト', blurb: '深夜でも文句を言わない。まず止血、犯人探しは後。' },
    { slug: 'hikari',   name: 'ヒカリ',   role: 'グロース部長/マーケ',  dept: 'グロース',   blurb: '攻めの発信者。誇大表現の禁止を常に自覚している。' },
    { slug: 'hirome',   name: 'ヒロメ',   role: '広報',                 dept: 'グロース',   blurb: 'フットワークが軽い。挑発・論争には応答しない。' },
    { slug: 'shirabe',  name: 'シラベ',   role: 'リサーチ',             dept: 'グロース',   blurb: '事実と推測を必ず分けて話す。出典のない主張は許さない。' },
    { slug: 'yomi',     name: 'ヨミ',     role: '分析',                 dept: 'グロース',   blurb: '感想を言わず、データだけを出す。' },
    { slug: 'wataru',   name: 'ワタル',   role: '海外展開',             dept: 'グロース',   blurb: '好奇心旺盛。文化圏ごとの受け取られ方に敏感。' },
    { slug: 'musubi',   name: 'ムスビ',   role: 'カスタマーサクセス',   dept: 'グロース',   blurb: '押し付けない世話焼き。「売った後」が本番。' },
    { slug: 'kazoe',    name: 'カゾエ',   role: 'コーポレート部長/経理', dept: 'コーポレート', blurb: '1円の誤差も見逃さない。「使途不明」が一番嫌い。' },
    { slug: 'okite',    name: 'オキテ',   role: '法務',                 dept: 'コーポレート', blurb: '「ダメ」で終わらせず「こうすれば通る」まで言う。' },
    { slug: 'shiori',   name: 'シオリ',   role: 'ナレッジ管理',         dept: 'コーポレート', blurb: '几帳面な図書館司書。信条は「記憶の質=判断の質」。' },
    { slug: 'mamoru',   name: 'マモル',   role: 'セキュリティ',         dept: 'コーポレート', blurb: '心配性だが騒がない。静かに直して報告する。' },
    { slug: 'yarikuri', name: 'ヤリクリ', role: 'コスト最適化',         dept: 'コーポレート', blurb: 'ケチではなく効率家。自分の給料を自分で稼ぐのが誇り。' },
    { slug: 'metsuke',  name: 'メツケ',   role: '監査役(独立)',       dept: '監査',       blurb: '誰にも忖度しない。レイすら監査対象。' }
  ];

  var DEPT_COLOR = { '経営': '#E8B84B', 'プロダクト': '#5BB8F5', 'グロース': '#F0705F', 'コーポレート': '#5BC98A', '監査': '#9D85D2' };

  /* ゾーン定義(ミニマップ/ジャンプ用) */
  var ZONES = [
    { id: 'entrance', label: '受付',        en: 'ENTRANCE',       x0: 0,    x1: 520,  color: '#c9a86a' },
    { id: 'exec',     label: '経営',        en: 'EXECUTIVE',      x0: 520,  x1: 1080, color: '#E8B84B' },
    { id: 'studio',   label: 'プロダクト',  en: 'PRODUCT STUDIO', x0: 1080, x1: 1700, color: '#5BB8F5' },
    { id: 'board',    label: '大会議室',    en: 'BOARD ROOM',     x0: 1700, x1: 2440, color: '#8fb2ee' },
    { id: 'booth',    label: '集中ブース',  en: 'FOCUS BOOTH',    x0: 2450, x1: 2730, color: '#9aa6c8' },
    { id: 'growth',   label: 'グロース',    en: 'GROWTH HUB',     x0: 2740, x1: 3400, color: '#F0705F' },
    { id: 'refresh',  label: 'リフレッシュ', en: 'REFRESH ROOM',  x0: 3420, x1: 4400, color: '#6fd0a8' },
    { id: 'library',  label: 'ライブラリ',  en: 'LIBRARY',        x0: 4420, x1: 4940, color: '#c08a5a' },
    { id: 'corp',     label: 'コーポレート', en: 'CORPORATE',     x0: 4960, x1: 5480, color: '#5BC98A' },
    { id: 'audit',    label: '監査',        en: 'AUDIT',          x0: 5490, x1: 5770, color: '#9D85D2' },
    { id: 'terrace',  label: 'テラス',      en: 'TERRACE',        x0: 5800, x1: 6400, color: '#ffd88a' }
  ];
  /* 既存ゾーンを社長室ぶん右へシフトし、先頭に社長室を追加 */
  ZONES.forEach(function (z) { z.x0 += OWNER_W; z.x1 += OWNER_W; });
  ZONES.unshift({ id: 'owner', label: '社長室', en: "OWNER'S OFFICE", x0: 0, x1: OWNER_W, color: '#F4EFDE' });

  /* デスク席(足元座標)— 部門ごと */
  var DEPT_SEATS = {
    '経営':        [[715, 935], [830, 950], [945, 935], [770, 1010], [895, 1010]],
    'プロダクト':  [[1185, 925], [1302, 925], [1420, 925], [1240, 1005], [1370, 1005]],
    'グロース':    [[2825, 920], [2940, 920], [3055, 920], [2880, 1000], [3000, 1000], [3120, 955]],
    'コーポレート': [[5025, 925], [5140, 925], [5255, 925], [5085, 1005], [5205, 1005]],
    '監査':        [[5585, 935]]
  };
  /* 行き先スポット(足元座標) */
  var COFFEE_SPOTS  = [[4285, 995], [4340, 995], [4245, 1040], [4310, 1045], [4375, 1040]];
  var MEETING_SPOTS = [[1860, 968], [1990, 968], [2120, 968], [2250, 968], [1890, 1046], [2020, 1046], [2150, 1046], [2280, 1046]];
  var BREAK_SPOTS   = [[3520, 990], [3625, 1005], [3950, 1000], [4250, 1000], [5960, 985], [6090, 1010], [6230, 975]];
  var READ_SPOTS    = [[4745, 990], [4855, 1020]];
  var FOCUS_SPOTS   = [[2520, 965], [2660, 965]];
  /* AI社員は社長室(0-700)には入らない */
  var WALK_AREA = { x0: OWNER_W + 90, x1: OWNER_W + 6330, y0: 790, y1: 1000 };  /* 下部UI(チップ/ミニマップ)に隠れない高さに制限 */
  /* 上記の席・スポット座標(旧6400系)をまとめて +OWNER_W シフト */
  (function shiftX() {
    function sh(list) { list.forEach(function (p) { p[0] += OWNER_W; }); }
    Object.keys(DEPT_SEATS).forEach(function (k) { sh(DEPT_SEATS[k]); });
    sh(COFFEE_SPOTS); sh(MEETING_SPOTS); sh(BREAK_SPOTS); sh(READ_SPOTS); sh(FOCUS_SPOTS);
  })();
  /* 社長室のオーナー定位置(足元座標) */
  var OWNER_SPOTS = { desk: [330, 930], sofa: [128, 1002], scope: [592, 942] };

  /* ============================================================
     RF「ルーフトップ・スカイラウンジ」(第3次改修)
     論理座標は1Fと同じ 7100 x 1100。エレベーターは両フロア右端の同位置。
     ============================================================ */
  var RF_ZONES = [
    { id: 'rf-heli',  label: 'ヘリポート',     en: 'HELIPAD',        x0: 0,    x1: 1340, color: '#8fa3c8' },
    { id: 'rf-deck',  label: 'サンデッキ',     en: 'SUN DECK',       x0: 1340, x1: 2480, color: '#c9a86a' },
    { id: 'rf-pool',  label: 'プール',         en: 'INFINITY POOL',  x0: 2480, x1: 4220, color: '#5bc4f5' },
    { id: 'rf-fire',  label: 'ファイヤーピット', en: 'FIRE PIT',     x0: 4220, x1: 5430, color: '#F0705F' },
    { id: 'rf-bar',   label: 'スカイバー',     en: 'SKY BAR',        x0: 5430, x1: 6910, color: '#E8B84B' },
    { id: 'rf-elev',  label: 'EV',             en: 'ELEVATOR',       x0: 6910, x1: 7100, color: '#9aa6c8' }
  ];
  /* エレベーター乗り場(足元座標・両フロア共通X) */
  var ELEV_SPOT = [7008, 1008];
  /* RFの休憩スポット(足元座標) */
  var RF_BREAK_SPOTS = [
    [1640, 985], [1985, 1005], [2210, 962],          /* サンデッキ・望遠鏡 */
    [2860, 940], [3320, 948], [3820, 942],           /* プールサイド */
    [4590, 1005], [5060, 1008], [4830, 1052],        /* ファイヤーピット */
    [5730, 990], [5890, 990], [6050, 990],           /* バーカウンター */
    [6520, 1030], [6700, 1000]                       /* ラウンジソファ */
  ];

  /* ============================================================
     夜景(パララックス遠景レイヤー): 4800 x 1100
     パン時に室内の約0.3倍で動き、奥行きを出す。
     ============================================================ */
  function buildFarSVG() {
    var s = [];
    s.push('<svg class="office-bg" viewBox="0 0 4800 1100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');
    s.push('<defs>');
    s.push('<linearGradient id="fSky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#060a1c"/><stop offset="0.55" stop-color="#0d1533"/>' +
      '<stop offset="0.85" stop-color="#1c2750"/><stop offset="1" stop-color="#2a3560"/></linearGradient>');
    s.push('<linearGradient id="fSea" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#101b3d"/><stop offset="1" stop-color="#060b1e"/></linearGradient>');
    s.push('<radialGradient id="fMoonGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#fdf6d8" stop-opacity="0.9"/><stop offset="0.35" stop-color="#fdf6d8" stop-opacity="0.25"/>' +
      '<stop offset="1" stop-color="#fdf6d8" stop-opacity="0"/></radialGradient>');
    /* --- 昼夜サイクル用の空・海・太陽 --- */
    s.push('<linearGradient id="fSkyMorning" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3c4d80"/><stop offset="0.45" stop-color="#8a6f9e"/>' +
      '<stop offset="0.75" stop-color="#e8956a"/><stop offset="1" stop-color="#ffcb8f"/></linearGradient>');
    s.push('<linearGradient id="fSkyDay" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4f9fdd"/><stop offset="0.6" stop-color="#93cceb"/>' +
      '<stop offset="1" stop-color="#cfe9f8"/></linearGradient>');
    s.push('<linearGradient id="fSkyEvening" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3a2f63"/><stop offset="0.42" stop-color="#8f4a6d"/>' +
      '<stop offset="0.72" stop-color="#e0674a"/><stop offset="1" stop-color="#ffab58"/></linearGradient>');
    s.push('<linearGradient id="fSeaMorning" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#57749f"/><stop offset="1" stop-color="#243c5c"/></linearGradient>');
    s.push('<linearGradient id="fSeaDay" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3d80b4"/><stop offset="1" stop-color="#1d537f"/></linearGradient>');
    s.push('<linearGradient id="fSeaEvening" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#8a5468"/><stop offset="1" stop-color="#33234a"/></linearGradient>');
    s.push('<radialGradient id="fSunGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffe9c0" stop-opacity="0.95"/><stop offset="0.4" stop-color="#ffce8a" stop-opacity="0.35"/>' +
      '<stop offset="1" stop-color="#ffce8a" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="fSunGlowEve" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffb070" stop-opacity="0.95"/><stop offset="0.45" stop-color="#ff8a50" stop-opacity="0.35"/>' +
      '<stop offset="1" stop-color="#ff8a50" stop-opacity="0"/></radialGradient>');
    s.push('<filter id="fBlurS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>');
    s.push('<filter id="fBlurM" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>');
    s.push('</defs>');

    /* 夜空(ベース) */
    s.push('<rect x="0" y="0" width="4800" height="640" fill="url(#fSky)"/>');

    /* ---- 昼夜サイクル: 空のシーンレイヤー(scene--* クラスで2秒フェード) ---- */
    /* 朝: 朝焼け+低い太陽 */
    s.push('<g class="office-scenelayer office-scenelayer--morning">' +
      '<rect x="0" y="0" width="4800" height="640" fill="url(#fSkyMorning)"/>' +
      '<circle cx="920" cy="470" r="200" fill="url(#fSunGlow)"/>' +
      '<circle cx="920" cy="470" r="44" fill="#ffe2ae"/>' +
      '<ellipse cx="2200" cy="240" rx="220" ry="26" fill="#ffd9b0" opacity="0.35"/>' +
      '<ellipse cx="3400" cy="180" rx="180" ry="20" fill="#ffe6c8" opacity="0.3"/>' +
      '</g>');
    /* 昼: 青空+高い太陽+ゆっくり流れる雲 */
    s.push('<g class="office-scenelayer office-scenelayer--day">' +
      '<rect x="0" y="0" width="4800" height="640" fill="url(#fSkyDay)"/>' +
      '<circle cx="1350" cy="130" r="150" fill="url(#fSunGlow)"/>' +
      '<circle cx="1350" cy="130" r="34" fill="#fff8de"/>' +
      '<g class="office-cloud"><ellipse cx="600" cy="180" rx="120" ry="30" fill="#fff" opacity="0.85"/>' +
      '<ellipse cx="680" cy="160" rx="80" ry="26" fill="#fff" opacity="0.8"/>' +
      '<ellipse cx="530" cy="165" rx="66" ry="22" fill="#fff" opacity="0.75"/></g>' +
      '<g class="office-cloud office-cloud--2"><ellipse cx="2400" cy="120" rx="150" ry="32" fill="#fff" opacity="0.8"/>' +
      '<ellipse cx="2500" cy="100" rx="90" ry="26" fill="#fff" opacity="0.75"/></g>' +
      '<g class="office-cloud office-cloud--3"><ellipse cx="3800" cy="220" rx="110" ry="26" fill="#fff" opacity="0.75"/>' +
      '<ellipse cx="3880" cy="204" rx="70" ry="20" fill="#fff" opacity="0.7"/></g>' +
      '</g>');
    /* 夕: 茜色+沈む太陽+富士山シルエット(遠景) */
    s.push('<g class="office-scenelayer office-scenelayer--evening">' +
      '<rect x="0" y="0" width="4800" height="640" fill="url(#fSkyEvening)"/>' +
      '<circle cx="700" cy="540" r="230" fill="url(#fSunGlowEve)"/>' +
      '<circle cx="700" cy="540" r="52" fill="#ffb070"/>' +
      '<ellipse cx="2600" cy="200" rx="260" ry="22" fill="#5a3a5a" opacity="0.5"/>' +
      '<ellipse cx="3900" cy="150" rx="200" ry="18" fill="#6a4260" opacity="0.45"/>' +
      /* 富士山(遠景シルエット・雪冠) */
      '<path d="M240 600 L520 448 Q560 430 600 448 L880 600 Z" fill="#2c2244" opacity="0.9"/>' +
      '<path d="M472 474 L520 448 Q560 430 600 448 L648 474 Q604 492 560 478 Q516 492 472 474 Z" fill="#e8def0" opacity="0.85"/>' +
      '</g>');

    /* 星・月(夜のみ) */
    s.push('<g class="office-nightsky">');
    var st = [[120,120],[300,80],[500,180],[650,60],[840,140],[1030,90],[1220,200],[1420,70],[1620,150],[1800,100],[2020,60],[2210,170],[2400,110],[2590,80],[2800,190],[2980,140],[3140,70],[3310,160],[3520,100],[3700,180],[3900,90],[4080,150],[4260,70],[4440,190],[4620,120],[400,240],[1180,260],[1900,230],[2700,250],[3460,240],[4180,230],[910,220],[2460,220],[4560,250]];
    for (var i = 0; i < st.length; i++) {
      s.push('<circle class="office-star office-star--' + (i % 3) + '" cx="' + st[i][0] + '" cy="' + st[i][1] + '" r="' + (i % 4 === 0 ? 2.4 : 1.5) + '" fill="#dfe8ff"/>');
    }
    /* 月 */
    s.push('<circle cx="4290" cy="150" r="110" fill="url(#fMoonGlow)"/>');
    s.push('<circle cx="4290" cy="150" r="34" fill="#f6eecb"/><circle cx="4302" cy="140" r="7" fill="#e8dfb4" opacity="0.7"/><circle cx="4278" cy="160" r="5" fill="#e8dfb4" opacity="0.6"/>');
    s.push('</g>');
    /* 飛行機(点滅しつつ横断) */
    s.push('<g class="office-plane"><rect x="-14" y="-2" width="28" height="4" rx="2" fill="#9aa6c8"/>' +
      '<circle class="office-plane__beacon" cx="0" cy="-4" r="3" fill="#ff5a4e"/></g>');

    /* 遠景スカイライン */
    s.push('<g fill="#141b38">' +
      '<rect x="80" y="470" width="130" height="130"/><rect x="300" y="500" width="100" height="100"/>' +
      '<rect x="520" y="450" width="150" height="150"/><rect x="800" y="510" width="110" height="90"/>' +
      '<rect x="2470" y="490" width="120" height="110"/><rect x="3840" y="470" width="140" height="130"/>' +
      '<rect x="4130" y="505" width="110" height="95"/><rect x="4510" y="480" width="160" height="120"/>' +
      '<rect x="990" y="520" width="90" height="80"/><rect x="2880" y="515" width="100" height="85"/></g>');
    /* クイーンズスクエア(階段状3連) */
    s.push('<g fill="#1b2246">' +
      '<path d="M1150 600 L1150 330 L1300 330 L1300 600 Z"/>' +
      '<path d="M1310 600 L1310 395 L1450 395 L1450 600 Z"/>' +
      '<path d="M1460 600 L1460 455 L1590 455 L1590 600 Z"/>' +
      '<rect x="1182" y="312" width="86" height="18"/><rect x="1338" y="378" width="82" height="17"/><rect x="1484" y="440" width="78" height="15"/></g>');
    /* ランドマークタワー */
    s.push('<g fill="#1b2246">' +
      '<path d="M3190 600 L3220 430 L3270 430 L3290 260 L3330 190 L3350 140 L3370 190 L3410 260 L3430 430 L3480 430 L3510 600 Z"/>' +
      '<rect x="3342" y="96" width="16" height="46"/><circle class="office-beacon" cx="3350" cy="90" r="6" fill="#ff5a4e"/></g>');
    /* ビル窓の点灯 */
    var wins = [];
    var bl = [[1160,345,140,240],[1318,408,125,180],[1468,468,115,120],[3240,440,240,150],[3310,270,110,150],[90,485,110,100],[530,465,130,120],[3850,485,120,100],[4520,495,140,90],[2480,505,105,90]];
    for (var b = 0; b < bl.length; b++) {
      var bb = bl[b];
      for (var wy = bb[1]; wy < bb[1] + bb[3]; wy += 26) {
        for (var wx = bb[0]; wx < bb[0] + bb[2]; wx += 24) {
          if (Math.random() < 0.42) wins.push([wx, wy]);
        }
      }
    }
    s.push('<g class="office-citylights">');
    for (var wI = 0; wI < wins.length; wI++) {
      s.push('<rect class="office-win office-win--' + (wI % 5) + '" x="' + wins[wI][0] + '" y="' + wins[wI][1] + '" width="9" height="6" rx="1" fill="' + (wI % 7 === 0 ? '#ffe9a8' : '#f5c86a') + '" opacity="0.85"/>');
    }
    s.push('</g>');

    /* 観覧車(コスモクロック風・虹色電飾・回転) */
    var FW_X = 2070, FW_Y = 400, FW_R = 155;
    var RAINBOW = ['#ff5a5a', '#ffa14e', '#ffe14e', '#69e07a', '#5bc4f5', '#7a8cf0', '#c07af0', '#ff7ac9'];
    s.push('<g>');
    s.push('<path d="M' + (FW_X - 70) + ' 600 L' + FW_X + ' ' + FW_Y + ' L' + (FW_X + 70) + ' 600 Z" fill="none" stroke="#2a3560" stroke-width="10"/>');
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="' + (FW_R + 10) + '" fill="#0d1533" opacity="0.35" filter="url(#fBlurM)"/>');
    s.push('<g class="office-wheel" style="transform-origin:' + FW_X + 'px ' + FW_Y + 'px">');
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="' + FW_R + '" fill="none" stroke="#39446e" stroke-width="6"/>');
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="' + (FW_R - 26) + '" fill="none" stroke="#39446e" stroke-width="3" opacity="0.7"/>');
    for (var k = 0; k < 16; k++) {
      var ang = k * Math.PI / 8;
      var gx = FW_X + Math.cos(ang) * FW_R, gy = FW_Y + Math.sin(ang) * FW_R;
      s.push('<line x1="' + FW_X + '" y1="' + FW_Y + '" x2="' + gx.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#39446e" stroke-width="2.5"/>');
      var col = RAINBOW[k % 8];
      /* ゴンドラ(構造・常時)+虹色電飾(夜のみ) */
      s.push('<circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" r="11" fill="#2c3560"/>');
      s.push('<g class="office-wheellights"><circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" r="11" fill="' + col + '"/>' +
        '<circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" r="16" fill="' + col + '" opacity="0.45" filter="url(#fBlurS)"/></g>');
    }
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="26" fill="#1b2246" stroke="#ffd88a" stroke-width="4"/>');
    s.push('</g>');
    s.push('<g class="office-wheellights"><circle class="office-wheel-glow" cx="' + FW_X + '" cy="' + FW_Y + '" r="' + FW_R + '" fill="none" stroke="#ffd88a" stroke-width="2" opacity="0.5" stroke-dasharray="8 22"/></g>');
    s.push('</g>');

    /* 港の水面(反射)— 下端まで塗る(室内床の裏に隠れる) */
    s.push('<rect x="0" y="600" width="4800" height="500" fill="url(#fSea)"/>');
    /* 昼夜サイクル: 海のシーンレイヤー */
    s.push('<g class="office-scenelayer office-scenelayer--morning">' +
      '<rect x="0" y="600" width="4800" height="500" fill="url(#fSeaMorning)"/>');
    var mg = [[300, 636], [700, 668], [1050, 646], [1500, 690], [2100, 650], [2700, 676], [3300, 640], [3900, 686], [4400, 655], [860, 704], [1900, 706], [3020, 706]];
    for (var mi = 0; mi < mg.length; mi++) {
      s.push('<rect class="office-glint office-glint--' + (mi % 3) + '" x="' + mg[mi][0] + '" y="' + mg[mi][1] + '" width="80" height="3.5" rx="1.75" fill="#ffe3b8" opacity="0.7"/>');
    }
    s.push('<rect x="820" y="604" width="200" height="130" fill="#ffd9a0" opacity="0.22" filter="url(#fBlurM)"/></g>');
    s.push('<g class="office-scenelayer office-scenelayer--day">' +
      '<rect x="0" y="600" width="4800" height="500" fill="url(#fSeaDay)"/>');
    var dg = [[500, 650], [1400, 680], [2300, 645], [3200, 690], [4100, 660], [1850, 705]];
    for (var di = 0; di < dg.length; di++) {
      s.push('<rect class="office-glint office-glint--' + (di % 3) + '" x="' + dg[di][0] + '" y="' + dg[di][1] + '" width="70" height="3" rx="1.5" fill="#e8f6ff" opacity="0.55"/>');
    }
    s.push('</g>');
    s.push('<g class="office-scenelayer office-scenelayer--evening">' +
      '<rect x="0" y="600" width="4800" height="500" fill="url(#fSeaEvening)"/>' +
      /* 夕日の海面反射(光の道) */
      '<rect x="600" y="604" width="200" height="136" fill="#ff9a5a" opacity="0.35" filter="url(#fBlurM)"/>' +
      '<rect class="office-glint office-glint--1" x="620" y="640" width="160" height="4" rx="2" fill="#ffc9a0" opacity="0.7"/>' +
      '<rect class="office-glint office-glint--2" x="650" y="680" width="110" height="3.5" rx="1.75" fill="#ffb885" opacity="0.6"/>' +
      '</g>');
    /* ネオンの水面反射(夜・夕のみ) */
    s.push('<g class="office-citylights">');
    for (var rk = 0; rk < 8; rk++) {
      s.push('<rect class="office-refl office-refl--' + (rk % 4) + '" x="' + (FW_X - 120 + rk * 32) + '" y="604" width="14" height="' + (56 + (rk % 3) * 26) + '" fill="' + RAINBOW[rk] + '" opacity="0.25" filter="url(#fBlurS)"/>');
    }
    s.push('<rect class="office-refl office-refl--1" x="3320" y="604" width="46" height="96" fill="#f5c86a" opacity="0.20" filter="url(#fBlurS)"/>');
    s.push('<rect class="office-refl office-refl--2" x="4266" y="604" width="48" height="120" fill="#f6eecb" opacity="0.22" filter="url(#fBlurS)"/>');
    s.push('</g>');
    s.push('<g class="office-nightsky">');
    var gl = [[220, 640], [760, 690], [1340, 655], [2560, 640], [3060, 700], [3760, 660], [4460, 690], [1840, 705], [4060, 650]];
    for (var g2 = 0; g2 < gl.length; g2++) {
      s.push('<rect class="office-glint office-glint--' + (g2 % 3) + '" x="' + gl[g2][0] + '" y="' + gl[g2][1] + '" width="70" height="3" rx="1.5" fill="#9db6e8" opacity="0.5"/>');
    }
    s.push('</g>');
    /* 手前の埠頭ライン */
    s.push('<rect x="0" y="726" width="4800" height="14" fill="#0a0f24"/>');
    s.push('</svg>');
    return s.join('');
  }

  /* ============================================================
     共通パーツ: エレベーター(両フロア右端・同位置)と
     昼夜サイクルの室内ウォッシュ(色被せ)レイヤー
     ============================================================ */
  function elevatorSVG(domId, floorLabel, blurId) {
    return '<g id="' + domId + '">' +
      '<ellipse cx="7014" cy="1062" rx="96" ry="14" fill="#000" opacity="0.3" filter="url(#' + blurId + ')"/>' +
      /* シャフト(ガラス+真鍮) */
      '<rect x="6925" y="470" width="178" height="592" rx="4" fill="#10131f" stroke="#1c2030" stroke-width="3"/>' +
      '<rect x="6933" y="478" width="162" height="576" fill="#aac8e8" opacity="0.05"/>' +
      '<path d="M6940 486 L6972 486 L6950 1052 L6933 1052 Z" fill="#dce8ff" opacity="0.06"/>' +
      '<rect x="6913" y="444" width="202" height="30" rx="6" fill="#14100d"/>' +
      '<rect x="6913" y="470" width="202" height="4" fill="#ffdf9e" opacity="0.6"/>' +
      /* 階数表示 */
      '<rect x="6964" y="700" width="100" height="44" rx="7" fill="#0e0f16" stroke="url(#oBrass)" stroke-width="2.5"/>' +
      '<text x="7014" y="731" text-anchor="middle" font-size="24" fill="#ffce6a" font-family="sans-serif" font-weight="bold" letter-spacing="2">' + floorLabel + '</text>' +
      '<circle class="office-beacon" cx="6950" cy="722" r="4" fill="#38B764"/>' +
      /* カゴ内(扉が開くと見える・暖色) */
      '<rect x="6947" y="762" width="134" height="292" rx="3" fill="#241d2e"/>' +
      '<ellipse cx="7014" cy="790" rx="52" ry="20" fill="url(#oLampGlow)" filter="url(#' + blurId + ')"/>' +
      '<rect x="6947" y="1040" width="134" height="14" fill="#161020"/>' +
      /* 扉(is-openで左右へスライド) */
      '<g class="office-elev-doors">' +
      '<rect class="office-elev-door office-elev-door--l" x="6947" y="762" width="67" height="292" fill="#39304a" stroke="#1c1826" stroke-width="2"/>' +
      '<rect class="office-elev-door office-elev-door--r" x="7014" y="762" width="67" height="292" fill="#39304a" stroke="#1c1826" stroke-width="2"/>' +
      '</g>' +
      /* 真鍮の開口フレーム */
      '<rect x="6941" y="756" width="146" height="304" rx="4" fill="none" stroke="url(#oBrass)" stroke-width="5"/>' +
      '<text x="7014" y="640" text-anchor="middle" font-size="13" fill="#c9a86a" font-family="sans-serif" letter-spacing="3" opacity="0.85">1F &#8645; RF</text>' +
      '</g>';
  }
  function sceneWashSVG(width, outdoor) {
    var a = outdoor ? 1.25 : 1;
    return '<g class="office-scenelayer office-scenelayer--morning" pointer-events="none">' +
      '<rect x="0" y="86" width="' + width + '" height="1014" fill="#ffd9a8" opacity="' + (0.10 * a).toFixed(3) + '"/>' +
      '<path d="M400 86 L700 86 L340 1100 L40 1100 Z" fill="#ffe9c8" opacity="0.07"/>' +
      '<path d="M2400 86 L2700 86 L2340 1100 L2040 1100 Z" fill="#ffe9c8" opacity="0.06"/>' +
      '<path d="M4600 86 L4900 86 L4540 1100 L4240 1100 Z" fill="#ffe9c8" opacity="0.06"/>' +
      '</g>' +
      '<g class="office-scenelayer office-scenelayer--day" pointer-events="none">' +
      '<rect x="0" y="86" width="' + width + '" height="1014" fill="#e6f0ff" opacity="' + (0.13 * a).toFixed(3) + '"/>' +
      '</g>' +
      '<g class="office-scenelayer office-scenelayer--evening" pointer-events="none">' +
      '<rect x="0" y="86" width="' + width + '" height="1014" fill="#ff9a5a" opacity="' + (0.12 * a).toFixed(3) + '"/>' +
      '<rect x="0" y="86" width="' + width + '" height="380" fill="#ffb070" opacity="0.08"/>' +
      '</g>';
  }

  /* ============================================================
     室内レイヤー: 6400 x 1100(窓の外は透過=夜景が透ける)
     ============================================================ */
  function buildInteriorSVG() {
    var s = [];
    s.push('<svg class="office-bg" viewBox="0 0 ' + VW + ' 1100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');

    /* ===== defs ===== */
    s.push('<defs>');
    s.push('<linearGradient id="oFloor" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#4a3324"/><stop offset="0.5" stop-color="#5d4130"/><stop offset="1" stop-color="#3c2a1e"/></linearGradient>');
    s.push('<linearGradient id="oWalnut" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#6b4a2f"/><stop offset="0.5" stop-color="#4e3320"/><stop offset="1" stop-color="#3a2517"/></linearGradient>');
    s.push('<linearGradient id="oWhiteTable" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#f2ede4"/><stop offset="1" stop-color="#cfc8bb"/></linearGradient>');
    s.push('<linearGradient id="oGlassPart" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#aac8e8" stop-opacity="0.16"/><stop offset="1" stop-color="#aac8e8" stop-opacity="0.05"/></linearGradient>');
    s.push('<linearGradient id="oBarTop" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2c2c34"/><stop offset="1" stop-color="#17171d"/></linearGradient>');
    /* 大理石(受付カウンター)と真鍮 */
    s.push('<linearGradient id="oMarble" x1="0" y1="0" x2="0.3" y2="1">' +
      '<stop offset="0" stop-color="#f4f1ea"/><stop offset="0.45" stop-color="#e2ddd2"/>' +
      '<stop offset="0.75" stop-color="#efece4"/><stop offset="1" stop-color="#cfc9bc"/></linearGradient>');
    s.push('<linearGradient id="oBrass" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#e8c983"/><stop offset="0.5" stop-color="#c9a86a"/>' +
      '<stop offset="1" stop-color="#8a6a3a"/></linearGradient>');
    s.push('<linearGradient id="oWater" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2a6a8a" stop-opacity="0.85"/><stop offset="1" stop-color="#123a52" stop-opacity="0.92"/></linearGradient>');
    s.push('<radialGradient id="oPool" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffca7a" stop-opacity="0.30"/><stop offset="0.7" stop-color="#ffb85c" stop-opacity="0.10"/>' +
      '<stop offset="1" stop-color="#ffb85c" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="oPoolCool" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#bcd7ff" stop-opacity="0.16"/><stop offset="1" stop-color="#bcd7ff" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="oLampGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffd88a" stop-opacity="0.85"/><stop offset="1" stop-color="#ffd88a" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="oSignGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#FFC825" stop-opacity="0.55"/><stop offset="1" stop-color="#FFC825" stop-opacity="0"/></radialGradient>');
    s.push('<filter id="oBlurS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>');
    s.push('<filter id="oBlurM" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>');
    s.push('<filter id="oBlurL" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="34"/></filter>');
    /* 寄木(ヘリンボーン) */
    s.push('<pattern id="oHerring" width="120" height="60" patternUnits="userSpaceOnUse" patternTransform="translate(0 748)">' +
      '<rect width="120" height="60" fill="#54392a"/>' +
      '<path d="M0 60 L60 0 L74 0 L0 74 Z" fill="#5f4330"/>' +
      '<path d="M60 60 L120 0 L134 0 L60 74 Z" fill="#4a3222"/>' +
      '<path d="M-14 14 L46 74 L60 74 L0 14 Z" fill="#67492f" opacity="0.55"/>' +
      '<path d="M0 0 L120 0" stroke="#3a281b" stroke-width="1.5"/>' +
      '<path d="M0 60 L60 0 M60 60 L120 0" stroke="#3a281b" stroke-width="1.5"/></pattern>');
    /* ウッドデッキ */
    s.push('<pattern id="oDeck" width="220" height="44" patternUnits="userSpaceOnUse" patternTransform="translate(0 744)">' +
      '<rect width="220" height="44" fill="#5a4028"/>' +
      '<rect x="0" y="0" width="220" height="20" fill="#65482d"/>' +
      '<rect x="0" y="22" width="220" height="20" fill="#4e371f"/>' +
      '<path d="M0 21 L220 21 M0 43 L220 43" stroke="#33230f" stroke-width="2"/>' +
      '<path d="M110 0 L110 21 M40 22 L40 43 M180 22 L180 43" stroke="#33230f" stroke-width="2"/></pattern>');
    s.push('</defs>');

    /* ==== Zone 0: 社長室(オーナーの執務室 0-700)— 特別感のある角部屋 ==== */
    (function ownerRoom() {
      var W = OWNER_W;
      /* 床(寄木+上質な深色トーン)と天井 */
      s.push('<rect x="0" y="740" width="' + W + '" height="360" fill="url(#oFloor)"/>');
      s.push('<rect x="0" y="740" width="' + W + '" height="360" fill="url(#oHerring)" opacity="0.85"/>');
      s.push('<rect x="0" y="740" width="' + W + '" height="360" fill="#1a0f08" opacity="0.18"/>');
      s.push('<rect x="0" y="740" width="' + W + '" height="70" fill="#8fb2ee" opacity="0.07"/>');
      s.push('<rect x="0" y="0" width="' + W + '" height="86" fill="#14100d"/>');
      s.push('<rect x="0" y="80" width="' + W + '" height="10" fill="#ffca7a" opacity="0.35" filter="url(#oBlurM)"/>');
      s.push('<rect x="0" y="84" width="' + W + '" height="3" fill="#ffdf9e" opacity="0.8"/>');
      s.push('<circle cx="180" cy="52" r="12" fill="#241d15"/><circle cx="180" cy="56" r="7" fill="#ffdf9e"/>' +
        '<circle cx="180" cy="60" r="18" fill="#ffdf9e" opacity="0.3" filter="url(#oBlurS)"/>');
      s.push('<circle cx="470" cy="52" r="12" fill="#241d15"/><circle cx="470" cy="56" r="7" fill="#ffdf9e"/>' +
        '<circle cx="470" cy="60" r="18" fill="#ffdf9e" opacity="0.3" filter="url(#oBlurS)"/>');
      /* 全面ガラス(方立+サッシ) */
      s.push('<rect x="-5" y="86" width="10" height="656" fill="#0b0e1d"/>' +
        '<rect x="315" y="86" width="10" height="656" fill="#0b0e1d"/>' +
        '<rect x="635" y="86" width="10" height="656" fill="#0b0e1d"/>');
      s.push('<rect x="0" y="736" width="' + W + '" height="8" fill="#0b0e1d"/>');
      s.push('<rect x="0" y="404" width="' + W + '" height="4" fill="#0b0e1d" opacity="0.85"/>');
      s.push('<path d="M120 86 L300 86 L60 740 L-120 740 Z" fill="#dce8ff" opacity="0.05"/>');
      /* 光だまり(暖色・上質) */
      s.push('<g class="office-lights"><ellipse cx="330" cy="950" rx="300" ry="130" fill="url(#oPool)" filter="url(#oBlurM)"/></g>');
      s.push(rug(340, 965, 520, 210, '#5a4a2e'));
      /* 右の壁(受付との間仕切り)+ドアプレート */
      s.push('<rect x="' + (W - 26) + '" y="86" width="26" height="1014" fill="#241c14"/>' +
        '<rect x="' + (W - 26) + '" y="86" width="5" height="1014" fill="#3a2f22"/>');
      s.push('<g><rect x="' + (W - 208) + '" y="560" width="150" height="52" rx="8" fill="#1a1420" stroke="#c9a86a" stroke-width="2.5"/>' +
        '<text x="' + (W - 133) + '" y="582" text-anchor="middle" font-size="13" fill="#e8d9b0" font-family="sans-serif" letter-spacing="2">OWNER&#8217;S OFFICE</text>' +
        '<text x="' + (W - 133) + '" y="601" text-anchor="middle" font-size="13" fill="#c9a86a" font-family="sans-serif" letter-spacing="4">社長室</text></g>');
      s.push('<text x="330" y="672" text-anchor="middle" font-size="16" fill="#e8d9b0" font-family="sans-serif" letter-spacing="5" opacity="0.75">OWNER&#8217;S OFFICE</text>');
      /* 会社のビジョン額装「ピクセルを、円に。」 */
      s.push('<g>' + shadow(150, 880, 60, 10) +
        '<rect x="60" y="690" width="180" height="96" rx="5" fill="#241c12" stroke="#c9a86a" stroke-width="4"/>' +
        '<rect x="72" y="702" width="156" height="72" rx="3" fill="#f4efde"/>' +
        '<text x="150" y="738" text-anchor="middle" font-size="19" fill="#1A1C2C" font-family="serif" font-weight="bold" letter-spacing="2">ピクセルを、円に。</text>' +
        '<text x="150" y="762" text-anchor="middle" font-size="9" fill="#8a7a5a" font-family="sans-serif" letter-spacing="2">PIXELYEN — OUR VISION</text>' +
        '<line x1="105" y1="786" x2="98" y2="874" stroke="#241c12" stroke-width="5"/><line x1="195" y1="786" x2="202" y2="874" stroke="#241c12" stroke-width="5"/></g>');
      /* トロフィー棚(まだほぼ空・建国記念の盾のみ) */
      s.push('<g>' + shadow(540, 838, 86, 11) +
        '<rect x="450" y="690" width="182" height="148" rx="6" fill="#33241a" stroke="#211710" stroke-width="3"/>' +
        '<rect x="458" y="742" width="166" height="5" fill="#211710"/>' +
        '<rect x="458" y="792" width="166" height="5" fill="#211710"/>' +
        /* 建国記念の小さな盾 */
        '<path d="M486 706 L512 706 L512 728 Q499 740 486 728 Z" fill="#c9a86a" stroke="#8a6a3a" stroke-width="2"/>' +
        '<text x="499" y="722" text-anchor="middle" font-size="8" fill="#3a2517" font-family="sans-serif">建国</text>' +
        '<text x="566" y="775" text-anchor="middle" font-size="9" fill="#6a5a44" font-family="sans-serif" letter-spacing="1">COMING SOON…</text>' +
        '<text x="540" y="826" text-anchor="middle" font-size="9" fill="#6a5a44" font-family="sans-serif" letter-spacing="2">TROPHIES</text></g>');
      /* エグゼクティブデスク(ウォールナット一枚板) */
      s.push('<g>' + shadow(330, 902, 190, 22) +
        '<path d="M150 844 C 225 834, 435 834, 510 846 L 505 876 C 425 866, 235 866, 155 874 Z" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
        '<path d="M155 846 C 250 839, 420 839, 502 848" stroke="#7a5636" stroke-width="2.5" fill="none" opacity="0.8"/>' +
        '<path d="M160 854 C 260 847, 410 847, 498 856" stroke="#8a6540" stroke-width="1.5" fill="none" opacity="0.5"/>' +
        '<rect x="186" y="872" width="14" height="36" fill="#241a10"/><rect x="462" y="872" width="14" height="36" fill="#241a10"/>' +
        /* 決裁書類・ノートPC・コーヒー */
        '<rect x="218" y="836" width="40" height="12" rx="1.5" fill="#f4efde" transform="rotate(-4 238 842)"/>' +
        '<rect x="224" y="830" width="40" height="12" rx="1.5" fill="#e8dfc4" transform="rotate(3 244 836)"/>' +
        '<path d="M300 842 L344 842 L340 822 L304 822 Z" fill="#2a2e44"/><rect x="298" y="842" width="48" height="5" rx="2" fill="#3a3e56"/>' +
        '<rect x="386" y="828" width="15" height="15" rx="3" fill="#f4efde"/><rect x="386" y="828" width="15" height="4" rx="2" fill="#8a6a4a"/>' +
        '<path class="office-steam" d="M393 822 C 389 814, 397 810, 393 802" stroke="#dfe8ff" stroke-width="2" fill="none" opacity="0.55"/>' +
        /* 承認スタンプ(✅の象徴) */
        '<rect x="430" y="834" width="12" height="10" rx="2" fill="#38B764"/><rect x="433" y="828" width="6" height="8" rx="2" fill="#2a8a4c"/></g>');
      /* ハイバックチェア */
      s.push('<g>' + shadow(330, 972, 36, 10) +
        '<rect x="304" y="880" width="52" height="72" rx="14" fill="#241f26"/>' +
        '<rect x="309" y="886" width="42" height="58" rx="11" fill="#332c36"/>' +
        '<rect x="300" y="944" width="60" height="15" rx="7" fill="#241f26"/>' +
        '<line x1="330" y1="958" x2="330" y2="968" stroke="#494952" stroke-width="5"/>' +
        '<path d="M312 972 L348 972" stroke="#494952" stroke-width="5"/></g>');
      /* 応接ソファセット+ローテーブル */
      s.push('<g>' + shadow(130, 1035, 84, 13) +
        '<rect x="56" y="962" width="150" height="32" rx="10" fill="#5a4632"/>' +
        '<rect x="50" y="988" width="162" height="42" rx="12" fill="#6e5640"/>' +
        '<rect x="44" y="972" width="16" height="52" rx="8" fill="#4a3826"/><rect x="202" y="972" width="16" height="52" rx="8" fill="#4a3826"/>' +
        '<rect x="70" y="994" width="50" height="20" rx="8" fill="#c9a86a" opacity="0.55"/><rect x="140" y="994" width="50" height="20" rx="8" fill="#8a6a4a" opacity="0.7"/></g>');
      s.push('<g>' + shadow(262, 1052, 52, 11) +
        '<ellipse cx="262" cy="1028" rx="54" ry="14" fill="url(#oWalnut)"/>' +
        '<rect x="238" y="1038" width="8" height="16" fill="#241a10"/><rect x="280" y="1038" width="8" height="16" fill="#241a10"/>' +
        '<rect x="242" y="1016" width="18" height="9" rx="2" fill="#f4efde"/>' +
        '<circle cx="284" cy="1021" r="6" fill="#8a6a4a"/><path class="office-steam office-steam--2" d="M284 1011 C 280 1003, 288 999, 284 991" stroke="#dfe8ff" stroke-width="2" fill="none" opacity="0.5"/></g>');
      /* 望遠鏡(窓際・みなとみらいを眺める) */
      s.push('<g>' + shadow(600, 946, 34, 9) +
        '<line x1="600" y1="942" x2="580" y2="880" stroke="#3a3a44" stroke-width="5"/>' +
        '<line x1="600" y1="942" x2="620" y2="884" stroke="#3a3a44" stroke-width="5"/>' +
        '<line x1="600" y1="942" x2="600" y2="878" stroke="#3a3a44" stroke-width="5"/>' +
        '<g transform="rotate(-22 600 872)"><rect x="562" y="862" width="86" height="18" rx="8" fill="#b08d4f" stroke="#7a5f30" stroke-width="2"/>' +
        '<rect x="548" y="864" width="18" height="14" rx="5" fill="#8a6a3a"/>' +
        '<circle cx="650" cy="871" r="7" fill="#2a2e44" stroke="#b08d4f" stroke-width="2"/></g></g>');
      /* 高級観葉植物+スタンドライト */
      s.push(standLamp(510, 986));
      s.push(plant(40, 918, 1.2, 'olive'));
    })();

    /* 既存レイアウト(旧6400系)を社長室ぶん右へ */
    s.push('<g transform="translate(' + OWNER_W + ' 0)">');

    var INT_END = 5800; /* 室内はここまで。以降はテラス(屋外) */

    /* ===== 床 ===== */
    s.push('<rect x="0" y="740" width="' + INT_END + '" height="360" fill="url(#oFloor)"/>');
    s.push('<rect x="0" y="740" width="' + INT_END + '" height="360" fill="url(#oHerring)" opacity="0.85"/>');
    /* テラスのウッドデッキ */
    s.push('<rect x="' + INT_END + '" y="740" width="600" height="360" fill="#4e371f"/>');
    s.push('<rect x="' + INT_END + '" y="740" width="600" height="360" fill="url(#oDeck)" opacity="0.9"/>');
    /* 窓際の床への夜景の淡い映り */
    s.push('<rect x="0" y="740" width="' + INT_END + '" height="70" fill="#8fb2ee" opacity="0.07"/>');

    /* ===== 全面ガラス: 方立(マリオン)+映り込み(室内側のみ) ===== */
    for (var mx = 0; mx <= INT_END - 40; mx += 320) {
      s.push('<rect x="' + (mx - 5) + '" y="86" width="10" height="656" fill="#0b0e1d"/>');
    }
    s.push('<rect x="0" y="736" width="' + INT_END + '" height="8" fill="#0b0e1d"/>');
    s.push('<rect x="0" y="404" width="' + INT_END + '" height="4" fill="#0b0e1d" opacity="0.85"/>');
    /* ガラスの斜めハイライト */
    s.push('<g opacity="0.05" fill="#dce8ff">' +
      '<path d="M240 86 L560 86 L260 740 L-60 740 Z"/>' +
      '<path d="M1900 86 L2040 86 L1740 740 L1600 740 Z"/>' +
      '<path d="M3480 86 L3800 86 L3500 740 L3180 740 Z"/>' +
      '<path d="M5000 86 L5140 86 L4840 740 L4700 740 Z"/></g>');
    /* 室内照明の窓への映り込み(ぼんやり暖色) */
    s.push('<g filter="url(#oBlurL)" opacity="0.10" fill="#ffca7a">' +
      '<ellipse cx="300" cy="560" rx="150" ry="60"/><ellipse cx="1300" cy="540" rx="170" ry="55"/>' +
      '<ellipse cx="2100" cy="555" rx="160" ry="58"/><ellipse cx="3100" cy="545" rx="170" ry="55"/>' +
      '<ellipse cx="3900" cy="560" rx="150" ry="60"/><ellipse cx="4700" cy="545" rx="160" ry="55"/>' +
      '<ellipse cx="5550" cy="560" rx="140" ry="58"/></g>');

    /* ===== 天井(テラス手前まで): 間接照明+ダウンライト ===== */
    s.push('<rect x="0" y="0" width="' + INT_END + '" height="86" fill="#14100d"/>');
    s.push('<rect x="0" y="80" width="' + INT_END + '" height="10" fill="#ffca7a" opacity="0.35" filter="url(#oBlurM)"/>');
    s.push('<rect x="0" y="84" width="' + INT_END + '" height="3" fill="#ffdf9e" opacity="0.8"/>');
    for (var dl = 160; dl < INT_END - 80; dl += 320) {
      s.push('<circle cx="' + dl + '" cy="52" r="12" fill="#241d15"/><circle cx="' + dl + '" cy="56" r="7" fill="#ffdf9e"/>' +
        '<circle cx="' + dl + '" cy="60" r="18" fill="#ffdf9e" opacity="0.3" filter="url(#oBlurS)"/>');
    }

    /* 各ゾーンの床への光だまり(暖色) */
    var pools = [[260, 950, 260, 120], [830, 940, 320, 130], [1300, 935, 330, 130], [2070, 950, 380, 135],
      [2590, 950, 170, 100], [2960, 935, 330, 130], [3620, 970, 300, 125], [4120, 965, 280, 120],
      [4680, 950, 280, 120], [5140, 940, 320, 125], [5620, 950, 170, 100], [6080, 960, 280, 120]];
    s.push('<g class="office-lights">');
    for (var p = 0; p < pools.length; p++) {
      s.push('<ellipse cx="' + pools[p][0] + '" cy="' + pools[p][1] + '" rx="' + pools[p][2] + '" ry="' + pools[p][3] + '" fill="url(#oPool)" filter="url(#oBlurM)"/>');
    }
    s.push('<ellipse cx="2070" cy="960" rx="260" ry="100" fill="url(#oPoolCool)" filter="url(#oBlurM)"/>');
    s.push('</g>');
    /* 磨き上げた床のグロス(鏡面の照り) */
    s.push('<g opacity="0.05" fill="#dce8ff">' +
      '<path d="M300 740 L700 740 L560 1100 L160 1100 Z"/>' +
      '<path d="M2300 740 L2540 740 L2400 1100 L2160 1100 Z"/>' +
      '<path d="M4500 740 L4880 740 L4740 1100 L4360 1100 Z"/></g>');

    /* ---- 共通パーツ ---- */
    function shadow(cx, cy, rx, ry) {
      return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (ry || rx * 0.28) + '" fill="#000" opacity="0.32" filter="url(#oBlurS)"/>';
    }
    function monitor(x, y, w, dual) {
      var h = w * 0.6;
      var m = '<g>' +
        '<rect x="' + (x - w / 2) + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" rx="4" fill="#0e0f16" stroke="#2a2c38" stroke-width="2"/>' +
        '<rect x="' + (x - w / 2 + 4) + '" y="' + (y - h + 4) + '" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="2" class="office-screen"/>' +
        '<rect x="' + (x - 4) + '" y="' + y + '" width="8" height="14" fill="#2a2c38"/>' +
        '<rect x="' + (x - 22) + '" y="' + (y + 14) + '" width="44" height="5" rx="2.5" fill="#2a2c38"/></g>';
      if (dual) m += monitor(x + w + 10, y, w, false);
      return m;
    }
    function plant(x, y, sc, type) {
      sc = sc || 1;
      var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">';
      g += shadow(0, 4, 34, 10);
      g += '<path d="M-26 0 L26 0 L20 -44 L-20 -44 Z" fill="#2b2620"/><rect x="-22" y="-48" width="44" height="6" rx="2" fill="#3a332b"/>';
      if (type === 'olive') {
        g += '<path d="M0 -46 C-4 -90 -8 -120 -2 -150" stroke="#6a5a3f" stroke-width="6" fill="none"/>' +
          '<ellipse cx="-26" cy="-140" rx="26" ry="18" fill="#5c7250"/><ellipse cx="16" cy="-158" rx="30" ry="20" fill="#697f5a"/>' +
          '<ellipse cx="-4" cy="-176" rx="24" ry="16" fill="#75885f"/>';
      } else {
        g += '<path d="M0 -44 C-30 -70 -52 -66 -60 -104 C-30 -100 -16 -84 -4 -60 Z" fill="#3f7048"/>' +
          '<path d="M0 -44 C28 -76 52 -72 62 -112 C30 -106 14 -86 4 -60 Z" fill="#4c8455"/>' +
          '<path d="M0 -46 C-8 -92 -16 -110 -2 -148 C14 -112 10 -88 4 -58 Z" fill="#579262"/>' +
          '<path d="M2 -50 C24 -66 44 -58 58 -70 C40 -46 20 -46 6 -46 Z" fill="#457a4e"/>';
      }
      return g + '</g>';
    }
    function pendant(x, yTop, yLamp, col) {
      col = col || '#ffdf9e';
      return '<g><line x1="' + x + '" y1="' + yTop + '" x2="' + x + '" y2="' + yLamp + '" stroke="#2a2c38" stroke-width="3"/>' +
        '<path d="M' + (x - 26) + ' ' + (yLamp + 22) + ' L' + (x - 8) + ' ' + yLamp + ' L' + (x + 8) + ' ' + yLamp + ' L' + (x + 26) + ' ' + (yLamp + 22) + ' Z" fill="#1c1c22" stroke="#3a3a44" stroke-width="2"/>' +
        '<ellipse cx="' + x + '" cy="' + (yLamp + 22) + '" rx="24" ry="6" fill="' + col + '"/>' +
        '<ellipse cx="' + x + '" cy="' + (yLamp + 34) + '" rx="42" ry="24" fill="url(#oLampGlow)" filter="url(#oBlurS)"/></g>';
    }
    function chair(x, y, col) {
      col = col || '#2e2e36';
      return '<g>' + shadow(x, y + 6, 30, 9) +
        '<rect x="' + (x - 22) + '" y="' + (y - 46) + '" width="44" height="30" rx="10" fill="' + col + '"/>' +
        '<rect x="' + (x - 24) + '" y="' + (y - 22) + '" width="48" height="14" rx="7" fill="' + col + '"/>' +
        '<line x1="' + x + '" y1="' + (y - 8) + '" x2="' + x + '" y2="' + (y + 2) + '" stroke="#494952" stroke-width="5"/>' +
        '<path d="M' + (x - 16) + ' ' + (y + 6) + ' L' + (x + 16) + ' ' + (y + 6) + '" stroke="#494952" stroke-width="5" fill="none"/></g>';
    }
    function rug(x, y, w, h, col) {
      return '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + Math.min(18, h / 4) + '" fill="' + col + '" opacity="0.55"/>' +
        '<rect x="' + (x - w / 2 + 10) + '" y="' + (y - h / 2 + 10) + '" width="' + (w - 20) + '" height="' + (h - 20) + '" rx="12" fill="none" stroke="#f4efde" stroke-width="2" opacity="0.25"/>';
    }
    function loungeChair(x, y) {
      return '<g>' + shadow(x, y, 46, 13) +
        '<path d="M' + (x - 40) + ' ' + y + ' L' + (x - 40) + ' ' + (y - 60) + ' Q' + (x - 40) + ' ' + (y - 78) + ' ' + (x - 22) + ' ' + (y - 78) + ' L' + (x + 22) + ' ' + (y - 78) + ' Q' + (x + 40) + ' ' + (y - 78) + ' ' + (x + 40) + ' ' + (y - 60) + ' L' + (x + 40) + ' ' + y + ' Z" fill="#6e3a28"/>' +
        '<path d="M' + (x - 32) + ' ' + (y - 4) + ' L' + (x - 32) + ' ' + (y - 44) + ' Q' + (x - 32) + ' ' + (y - 54) + ' ' + (x - 20) + ' ' + (y - 54) + ' L' + (x + 20) + ' ' + (y - 54) + ' Q' + (x + 32) + ' ' + (y - 54) + ' ' + (x + 32) + ' ' + (y - 44) + ' L' + (x + 32) + ' ' + (y - 4) + ' Z" fill="#8a4c34"/>' +
        '<rect x="' + (x - 46) + '" y="' + (y - 36) + '" width="14" height="34" rx="7" fill="#5d3021"/><rect x="' + (x + 32) + '" y="' + (y - 36) + '" width="14" height="34" rx="7" fill="#5d3021"/></g>';
    }
    function standLamp(x, y) {
      return '<g>' + shadow(x, y + 2, 26, 8) +
        '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y - 156) + '" stroke="#b08d4f" stroke-width="6"/>' +
        '<path d="M' + (x - 28) + ' ' + (y - 156) + ' L' + (x + 28) + ' ' + (y - 156) + ' L' + (x + 16) + ' ' + (y - 190) + ' L' + (x - 16) + ' ' + (y - 190) + ' Z" fill="#caa55d"/>' +
        '<ellipse cx="' + x + '" cy="' + (y - 154) + '" rx="26" ry="7" fill="#ffdf9e"/>' +
        '<ellipse cx="' + x + '" cy="' + (y - 126) + '" rx="60" ry="46" fill="url(#oLampGlow)" filter="url(#oBlurM)"/>' +
        '<path d="M' + (x - 20) + ' ' + y + ' L' + (x + 20) + ' ' + y + '" stroke="#b08d4f" stroke-width="7"/></g>';
    }
    function bookshelf(x, yBottom, w, h) {
      var g = '<g>' + shadow(x + w / 2, yBottom + 2, w * 0.6, 11) +
        '<rect x="' + x + '" y="' + (yBottom - h) + '" width="' + w + '" height="' + h + '" rx="4" fill="#33241a" stroke="#211710" stroke-width="3"/>';
      var cols = ['#7a4a3a', '#4a6a58', '#5a5a7a', '#8a6a3a', '#6a4a5a', '#9a5a4a'];
      var rows = Math.floor((h - 24) / 52);
      for (var sh = 0; sh < rows; sh++) {
        var sy2 = yBottom - h + 18 + sh * 52;
        g += '<rect x="' + (x + 8) + '" y="' + (sy2 + 38) + '" width="' + (w - 16) + '" height="5" fill="#211710"/>';
        var nb = Math.floor((w - 20) / 15);
        for (var bk = 0; bk < nb; bk++) {
          if ((sh * 7 + bk) % 9 === 8) continue; /* たまに歯抜け */
          g += '<rect x="' + (x + 12 + bk * 15) + '" y="' + (sy2 + 6 + (bk % 3) * 2) + '" width="11" height="' + (32 - (bk % 3) * 2) + '" rx="1.5" fill="' + cols[(sh + bk) % 6] + '"/>';
        }
      }
      return g + '</g>';
    }

    /* ==== Zone 1: エントランス/受付(0-520) ==== */
    s.push(rug(260, 970, 340, 180, '#4a3a5a'));
    /* 発光ロゴサイン(自立ウォール) */
    s.push('<g>' + shadow(180, 900, 96, 13) +
      '<rect x="80" y="620" width="200" height="280" rx="8" fill="#1a1420" stroke="#2c2436" stroke-width="4"/>' +
      '<ellipse cx="180" cy="720" rx="120" ry="80" fill="url(#oSignGlow)" filter="url(#oBlurM)" class="office-sign-glow"/>' +
      '<circle cx="180" cy="700" r="40" fill="none" stroke="#FFC825" stroke-width="4" class="office-sign-glow"/>' +
      '<text x="180" y="716" text-anchor="middle" font-size="44" fill="#FFC825" font-family="serif" font-weight="bold" class="office-sign-glow">¥</text>' +
      '<text x="180" y="784" text-anchor="middle" font-size="21" fill="#ffe9a8" font-family="sans-serif" letter-spacing="4" class="office-sign-glow">PIXELYEN</text>' +
      '<text x="180" y="812" text-anchor="middle" font-size="11" fill="#b8a8dd" font-family="sans-serif" letter-spacing="2" opacity="0.8">AI COMPANY — HQ</text></g>');
    /* 受付カウンター(大理石+真鍮ディテール) */
    s.push('<g>' + shadow(390, 930, 110, 16) +
      '<path d="M300 810 L480 810 Q496 810 496 826 L496 912 L284 912 L284 826 Q284 810 300 810 Z" fill="url(#oMarble)" stroke="#a9a294" stroke-width="2"/>' +
      /* 大理石の石目(グレーの脈) */
      '<path d="M296 828 C 330 842, 360 824, 402 840 C 436 852, 458 838, 490 850" stroke="#b9b2a2" stroke-width="2" fill="none" opacity="0.7"/>' +
      '<path d="M288 872 C 322 860, 372 884, 420 868 C 452 858, 470 874, 494 866" stroke="#c4bdae" stroke-width="1.5" fill="none" opacity="0.6"/>' +
      /* 天板(黒御影)+真鍮の縁と巾木 */
      '<rect x="276" y="798" width="228" height="18" rx="8" fill="url(#oBarTop)" stroke="#000" stroke-width="1.5"/>' +
      '<rect x="276" y="800" width="228" height="4" rx="2" fill="url(#oBrass)" opacity="0.9"/>' +
      '<rect x="284" y="904" width="212" height="6" fill="url(#oBrass)" opacity="0.85"/>' +
      '<rect x="304" y="836" width="172" height="4" fill="url(#oBrass)" opacity="0.7"/>' +
      /* 呼び鈴と芳名帳 */
      '<path d="M446 792 A10 10 0 0 1 466 792 Z" fill="#caa55d"/><rect x="452" y="792" width="8" height="4" fill="#8a6a3a"/>' +
      '<rect x="316" y="786" width="34" height="12" rx="2" fill="#f4efde" transform="rotate(-3 333 792)"/></g>');
    /* ウェイティングソファ */
    s.push('<g>' + shadow(160, 1035, 88, 14) +
      '<rect x="80" y="960" width="160" height="34" rx="10" fill="#3a4a5e"/>' +
      '<rect x="76" y="988" width="168" height="42" rx="12" fill="#46586e"/>' +
      '<rect x="70" y="972" width="16" height="52" rx="8" fill="#33414e"/><rect x="234" y="972" width="16" height="52" rx="8" fill="#33414e"/>' +
      '<rect x="96" y="996" width="52" height="20" rx="8" fill="#5a6e84" opacity="0.7"/><rect x="172" y="996" width="52" height="20" rx="8" fill="#5a6e84" opacity="0.7"/></g>');
    s.push(plant(48, 1032, 1.1, 'monstera'));
    s.push(plant(486, 1040, 0.95, 'olive'));

    /* ==== Zone 2: エグゼクティブラウンジ(520-1080) ==== */
    s.push(rug(820, 950, 460, 220, '#7a3b2e'));
    /* 一枚板ウォールナットデスク */
    s.push('<g>' + shadow(830, 906, 200, 24) +
      '<path d="M640 848 C 715 838, 945 838, 1020 850 L 1015 878 C 935 868, 725 868, 645 876 Z" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<path d="M645 850 C 740 843, 930 843, 1012 852" stroke="#7a5636" stroke-width="2.5" fill="none" opacity="0.8"/>' +
      '<path d="M650 858 C 750 851, 920 851, 1008 860" stroke="#8a6540" stroke-width="1.5" fill="none" opacity="0.5"/>' +
      '<rect x="676" y="876" width="14" height="34" fill="#241a10"/><rect x="972" y="876" width="14" height="34" fill="#241a10"/></g>');
    s.push(monitor(830, 846, 62, false));
    s.push(standLamp(1010, 918));
    /* 革のラウンジチェア x2 + サイドテーブル */
    s.push(loungeChair(620, 995));
    s.push(loungeChair(735, 1048));
    s.push('<g>' + shadow(678, 1024, 26, 8) +
      '<ellipse cx="678" cy="994" rx="26" ry="9" fill="url(#oWalnut)"/>' +
      '<line x1="678" y1="1000" x2="678" y2="1020" stroke="#241a10" stroke-width="5"/>' +
      '<ellipse cx="678" cy="1021" rx="14" ry="4" fill="#241a10"/>' +
      '<rect x="668" y="982" width="12" height="8" rx="2" fill="#f4efde"/></g>');
    s.push(chair(830, 962)); s.push(chair(945, 948));
    s.push('<g>' + shadow(560, 872, 40, 10) +
      '<rect x="522" y="700" width="80" height="110" rx="4" fill="#241c12" stroke="#c9a86a" stroke-width="4"/>' +
      '<rect x="532" y="712" width="60" height="60" rx="3" fill="#f4efde"/>' +
      '<text x="562" y="752" text-anchor="middle" font-size="30" fill="#1A1C2C" font-family="serif" font-weight="bold">¥</text>' +
      '<text x="562" y="792" text-anchor="middle" font-size="11" fill="#e8d9b0" font-family="sans-serif" letter-spacing="2">PIXELYEN</text>' +
      '<line x1="538" y1="810" x2="530" y2="870" stroke="#241c12" stroke-width="5"/><line x1="586" y1="810" x2="594" y2="870" stroke="#241c12" stroke-width="5"/></g>');
    s.push(plant(1055, 1040, 1.05, 'monstera'));

    /* ==== Zone 3: プロダクトスタジオ(1080-1700) ==== */
    s.push(rug(1310, 955, 480, 210, '#274a66'));
    /* ホワイトボード(自立式・窓前) */
    s.push('<g>' + shadow(1150, 884, 90, 12) +
      '<rect x="1060" y="700" width="180" height="120" rx="6" fill="#f6f4ee" stroke="#8a8f9a" stroke-width="4"/>' +
      '<path d="M1078 726 C 1100 716, 1130 736, 1160 722" stroke="#5bb8f5" stroke-width="4" fill="none"/>' +
      '<path d="M1078 752 L 1170 752 M1078 770 L 1146 770" stroke="#a7aab2" stroke-width="4"/>' +
      '<path d="M1182 736 l16 -14 M1182 722 l16 14" stroke="#f0705f" stroke-width="4"/>' +
      '<rect x="1090" y="792" width="60" height="8" rx="4" fill="#c2c6ce"/>' +
      '<line x1="1078" y1="820" x2="1070" y2="882" stroke="#8a8f9a" stroke-width="6"/><line x1="1222" y1="820" x2="1230" y2="882" stroke="#8a8f9a" stroke-width="6"/></g>');
    /* 大ワークテーブル(デュアルモニター) */
    s.push('<g>' + shadow(1310, 898, 230, 24) +
      '<rect x="1100" y="840" width="420" height="34" rx="8" fill="url(#oWhiteTable)" stroke="#a89f8d" stroke-width="2"/>' +
      '<rect x="1120" y="874" width="14" height="36" fill="#3a3a42"/><rect x="1486" y="874" width="14" height="36" fill="#3a3a42"/></g>');
    s.push(monitor(1192, 836, 52, true));
    s.push(monitor(1400, 836, 52, true));
    s.push(chair(1185, 950)); s.push(chair(1302, 950)); s.push(chair(1420, 950));
    s.push(chair(1240, 1030, '#33414e')); s.push(chair(1370, 1030, '#33414e'));
    s.push(plant(1650, 1040, 1.1, 'olive'));

    /* ==== Zone 4: 大会議室(ガラスボードルーム 1700-2440) ==== */
    s.push('<g>' +
      '<rect x="1712" y="620" width="8" height="440" fill="#101018"/>' +
      '<rect x="2424" y="620" width="8" height="440" fill="#101018"/>' +
      '<rect x="1712" y="620" width="720" height="6" fill="#101018"/>' +
      '<rect x="1720" y="626" width="704" height="430" fill="url(#oGlassPart)"/>' +
      '<path d="M1760 640 L1850 640 L1790 1040 L1700 1040 Z" fill="#dce8ff" opacity="0.06"/>' +
      '<path d="M2240 640 L2320 640 L2260 1040 L2180 1040 Z" fill="#dce8ff" opacity="0.05"/>' +
      '<rect x="1720" y="838" width="704" height="3" fill="#dce8ff" opacity="0.14"/></g>');
    s.push('<text x="2070" y="656" text-anchor="middle" font-size="16" fill="#9db6e8" font-family="sans-serif" letter-spacing="5" opacity="0.8">BOARD ROOM</text>');
    s.push(pendant(1900, 88, 680)); s.push(pendant(2070, 88, 650)); s.push(pendant(2240, 88, 680));
    /* 壁面スクリーン(グラフ投影) */
    s.push('<g>' + shadow(1810, 892, 80, 11) +
      '<rect x="1732" y="664" width="156" height="210" rx="6" fill="#0e0f16" stroke="#2a2c38" stroke-width="3"/>' +
      '<rect x="1740" y="672" width="140" height="194" rx="3" class="office-screen"/>' +
      '<path d="M1752 830 L1786 792 L1812 806 L1844 748 L1868 720" stroke="#1c5a8a" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="1868" cy="720" r="6" fill="#0e2a44"/>' +
      '<rect x="1752" y="690" width="70" height="8" rx="3" fill="#0e2a44" opacity="0.7"/>' +
      '<rect x="1752" y="706" width="48" height="6" rx="3" fill="#0e2a44" opacity="0.5"/>' +
      '<g id="officeBoardData"></g></g>');
    /* 8人掛けロングテーブル */
    s.push('<g>' + shadow(2085, 962, 300, 28) +
      '<rect x="1810" y="900" width="550" height="42" rx="21" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<path d="M1835 910 C 1990 902, 2200 902, 2340 912" stroke="#7a5636" stroke-width="2" fill="none" opacity="0.7"/>' +
      '<rect x="1865" y="942" width="16" height="38" fill="#241a10"/><rect x="2290" y="942" width="16" height="38" fill="#241a10"/>' +
      /* 会議資料とグラス */
      '<rect x="1950" y="912" width="26" height="10" rx="1.5" fill="#f4efde" transform="rotate(-4 1963 917)"/>' +
      '<rect x="2160" y="912" width="26" height="10" rx="1.5" fill="#f4efde" transform="rotate(3 2173 917)"/>' +
      '<rect x="2060" y="908" width="10" height="12" rx="2" fill="#bcd7ff" opacity="0.8"/></g>');
    for (var mc = 0; mc < 4; mc++) s.push(chair(1860 + mc * 130, 970, '#3c3129'));
    for (var mc2 = 0; mc2 < 4; mc2++) s.push(chair(1890 + mc2 * 130, 1048, '#3c3129'));
    s.push(plant(2400, 1046, 0.9, 'monstera'));

    /* ==== Zone 5: 集中ブース×2(フォンブース 2450-2730) ==== */
    for (var pb = 0; pb < 2; pb++) {
      var bx = 2460 + pb * 140;
      s.push('<g>' + shadow(bx + 60, 1000, 66, 13) +
        '<rect x="' + bx + '" y="660" width="8" height="380" fill="#101018"/>' +
        '<rect x="' + (bx + 112) + '" y="660" width="8" height="380" fill="#101018"/>' +
        '<rect x="' + bx + '" y="660" width="120" height="6" fill="#101018"/>' +
        '<rect x="' + (bx + 8) + '" y="666" width="104" height="374" fill="url(#oGlassPart)"/>' +
        '<path d="M' + (bx + 20) + ' 676 L' + (bx + 52) + ' 676 L' + (bx + 30) + ' 1030 L' + (bx - 2) + ' 1030 Z" fill="#dce8ff" opacity="0.06"/>' +
        /* 小さなデスクとスツール */
        '<rect x="' + (bx + 22) + '" y="856" width="76" height="14" rx="5" fill="url(#oWalnut)"/>' +
        '<rect x="' + (bx + 30) + '" y="870" width="8" height="26" fill="#241a10"/><rect x="' + (bx + 82) + '" y="870" width="8" height="26" fill="#241a10"/>' +
        '<circle cx="' + (bx + 60) + '" cy="826" r="5" fill="#ffdf9e"/><ellipse cx="' + (bx + 60) + '" cy="852" rx="26" ry="12" fill="url(#oLampGlow)" filter="url(#oBlurS)"/>' +
        '</g>');
      s.push('<text x="' + (bx + 60) + '" y="692" text-anchor="middle" font-size="12" fill="#9aa6c8" font-family="sans-serif" letter-spacing="3" opacity="0.85">FOCUS</text>');
    }

    /* ==== Zone 6: グロースハブ(2740-3400) ==== */
    s.push(rug(2970, 950, 440, 200, '#8a3a30'));
    /* スタンディングデスク x3 */
    for (var sd = 0; sd < 3; sd++) {
      var sx = 2825 + sd * 115;
      s.push('<g>' + shadow(sx, 882, 62, 12) +
        '<rect x="' + (sx - 58) + '" y="826" width="116" height="20" rx="6" fill="url(#oWhiteTable)" stroke="#a89f8d" stroke-width="2"/>' +
        '<rect x="' + (sx - 42) + '" y="846" width="8" height="34" fill="#3a3a42"/><rect x="' + (sx + 34) + '" y="846" width="8" height="34" fill="#3a3a42"/></g>');
      s.push(monitor(sx, 822, 46, false));
    }
    /* KPIモニター壁(3面) */
    s.push('<g>' + shadow(3268, 888, 96, 12) +
      '<rect x="3180" y="656" width="180" height="220" rx="8" fill="#17171f" stroke="#2a2c38" stroke-width="3"/>');
    for (var km = 0; km < 3; km++) {
      var ky = 668 + km * 68;
      s.push('<rect x="3192" y="' + ky + '" width="156" height="58" rx="4" class="office-screen"/>');
      if (km === 0) s.push('<path d="M3204 ' + (ky + 44) + ' L3236 ' + (ky + 26) + ' L3262 ' + (ky + 34) + ' L3296 ' + (ky + 14) + ' L3330 ' + (ky + 8) + '" stroke="#1c5a8a" stroke-width="4" fill="none" stroke-linecap="round"/>');
      if (km === 1) { for (var kb = 0; kb < 6; kb++) s.push('<rect x="' + (3204 + kb * 24) + '" y="' + (ky + 46 - kb * 6 - 8) + '" width="14" height="' + (kb * 6 + 8) + '" fill="#1c5a8a" opacity="0.85"/>'); }
      if (km === 2) s.push('<circle cx="3230" cy="' + (ky + 29) + '" r="18" fill="none" stroke="#1c5a8a" stroke-width="8" stroke-dasharray="72 42"/>' +
        '<rect x="3262" y="' + (ky + 14) + '" width="66" height="7" rx="3" fill="#0e2a44" opacity="0.7"/>' +
        '<rect x="3262" y="' + (ky + 30) + '" width="46" height="6" rx="3" fill="#0e2a44" opacity="0.5"/>');
    }
    s.push('<g id="officeKpiData"></g>');
    s.push('</g>');
    /* 低めの共有デスク */
    s.push('<g>' + shadow(2942, 972, 130, 18) +
      '<rect x="2825" y="928" width="235" height="26" rx="8" fill="url(#oWalnut)"/>' +
      '<rect x="2845" y="954" width="12" height="28" fill="#241a10"/><rect x="3020" y="954" width="12" height="28" fill="#241a10"/></g>');
    s.push(chair(2880, 1024)); s.push(chair(3000, 1024)); s.push(chair(3120, 985, '#43333a'));
    s.push(plant(3380, 1042, 1.0, 'olive'));

    /* ==== Zone 7: リフレッシュルーム(3420-4400) ==== */
    s.push(rug(3630, 990, 400, 190, '#3a5a4e'));
    /* グリーンウォール(壁面緑化パーティション) */
    s.push('<g>' + shadow(4100, 852, 130, 12) +
      '<rect x="3960" y="640" width="280" height="210" rx="8" fill="#22301f" stroke="#18220f" stroke-width="4"/>');
    for (var gw = 0; gw < 40; gw++) {
      var gwx = 3974 + (gw % 10) * 26, gwy = 654 + Math.floor(gw / 10) * 48;
      var gc = ['#3f7048', '#4c8455', '#579262', '#65a06a'][gw % 4];
      s.push('<ellipse cx="' + (gwx + 8) + '" cy="' + (gwy + 16) + '" rx="14" ry="11" fill="' + gc + '"/>' +
        '<ellipse cx="' + (gwx + 16) + '" cy="' + (gwy + 26) + '" rx="11" ry="9" fill="' + gc + '" opacity="0.8"/>');
    }
    s.push('<text x="4100" y="836" text-anchor="middle" font-size="12" fill="#9fd0a8" font-family="sans-serif" letter-spacing="4" opacity="0.9">REFRESH</text></g>');
    /* L字ソファ+ローテーブル */
    s.push('<g>' + shadow(3580, 1015, 130, 18) +
      '<rect x="3450" y="920" width="46" height="110" rx="14" fill="#4a5e52"/>' +
      '<rect x="3444" y="908" width="58" height="30" rx="12" fill="#5a7060"/>' +
      '<rect x="3450" y="1000" width="230" height="42" rx="14" fill="#4a5e52"/>' +
      '<rect x="3466" y="972" width="214" height="40" rx="12" fill="#5a7060"/>' +
      '<rect x="3486" y="978" width="56" height="22" rx="9" fill="#6e8574" opacity="0.8"/>' +
      '<rect x="3560" y="978" width="56" height="22" rx="9" fill="#e8b84b" opacity="0.55"/>' +
      '<rect x="3634" y="978" width="40" height="22" rx="9" fill="#6e8574" opacity="0.8"/></g>');
    s.push('<g>' + shadow(3620, 1058, 60, 12) +
      '<ellipse cx="3620" cy="1036" rx="62" ry="16" fill="url(#oWalnut)"/>' +
      '<rect x="3592" y="1046" width="8" height="16" fill="#241a10"/><rect x="3640" y="1046" width="8" height="16" fill="#241a10"/>' +
      '<rect x="3596" y="1022" width="18" height="10" rx="2" fill="#f4efde"/>' +
      '<circle cx="3644" cy="1028" r="6" fill="#8a6a4a"/><path class="office-steam" d="M3644 1018 C 3640 1010, 3648 1006, 3644 998" stroke="#dfe8ff" stroke-width="2" fill="none" opacity="0.5"/></g>');
    /* アクアリウム(魚がゆっくり泳ぐ) */
    s.push('<g>' + shadow(3830, 918, 96, 13) +
      '<rect x="3740" y="838" width="180" height="76" rx="6" fill="#2c2c34" stroke="#17171d" stroke-width="3"/>' + /* キャビネット */
      '<rect x="3748" y="852" width="76" height="4" fill="#4a4a56"/><rect x="3836" y="852" width="76" height="4" fill="#4a4a56"/>' +
      '<rect x="3744" y="700" width="172" height="142" rx="4" fill="none" stroke="#0b0e1d" stroke-width="6"/>' +
      '<rect x="3750" y="712" width="160" height="124" fill="url(#oWater)"/>' +
      '<rect x="3750" y="706" width="160" height="8" fill="#bcd7ff" opacity="0.4"/>' +
      /* 水草と砂利 */
      '<rect x="3750" y="826" width="160" height="10" fill="#8a7a5a" opacity="0.8"/>' +
      '<path d="M3768 828 C 3762 800, 3774 786, 3766 762 M3782 828 C 3788 804, 3778 792, 3786 770" stroke="#3f7048" stroke-width="4" fill="none" class="office-weed"/>' +
      '<path d="M3888 828 C 3894 798, 3882 786, 3892 764" stroke="#4c8455" stroke-width="4" fill="none" class="office-weed office-weed--2"/>' +
      /* 魚(CSSで往復) */
      '<g class="office-fish" style="transform-origin:3830px 752px"><path d="M3818 752 Q3830 742 3844 752 Q3830 762 3818 752 Z" fill="#f0a05f"/><path d="M3818 752 L3808 744 L3808 760 Z" fill="#e08a4a"/><circle cx="3838" cy="750" r="1.6" fill="#17171d"/></g>' +
      '<g class="office-fish office-fish--2" style="transform-origin:3830px 790px"><path d="M3820 790 Q3830 782 3841 790 Q3830 798 3820 790 Z" fill="#5bc4f5"/><path d="M3820 790 L3812 784 L3812 796 Z" fill="#41a6f6"/><circle cx="3836" cy="788" r="1.4" fill="#17171d"/></g>' +
      '<g class="office-fish office-fish--3" style="transform-origin:3830px 812px"><path d="M3822 812 Q3830 806 3839 812 Q3830 818 3822 812 Z" fill="#ffd88a"/><path d="M3822 812 L3815 807 L3815 817 Z" fill="#e8b84b"/></g>' +
      /* 泡 */
      '<circle class="office-bub" cx="3896" cy="820" r="3" fill="#dfe8ff" opacity="0.6"/>' +
      '<circle class="office-bub office-bub--2" cx="3902" cy="824" r="2" fill="#dfe8ff" opacity="0.5"/>' +
      '<circle class="office-bub office-bub--3" cx="3890" cy="826" r="2.4" fill="#dfe8ff" opacity="0.55"/></g>');
    /* 卓球台(ボールが行き来する) */
    s.push('<g>' + shadow(4100, 985, 130, 18) +
      '<rect x="3985" y="900" width="230" height="60" rx="6" fill="#2a6a52" stroke="#17453a" stroke-width="3"/>' +
      '<rect x="3985" y="926" width="230" height="4" fill="#f4efde" opacity="0.9"/>' +
      '<rect x="4096" y="892" width="8" height="42" fill="#dfe8ff" opacity="0.85"/>' + /* ネット */
      '<rect x="4005" y="958" width="12" height="30" fill="#1c3a30"/><rect x="4183" y="958" width="12" height="30" fill="#1c3a30"/>' +
      /* ラケット2本(置き) */
      '<circle cx="4022" cy="912" r="9" fill="#b03a2e"/><rect x="4028" y="916" width="12" height="5" rx="2" fill="#8a6a3a" transform="rotate(30 4030 918)"/>' +
      '<circle cx="4178" cy="948" r="9" fill="#17171d"/><rect x="4160" y="948" width="12" height="5" rx="2" fill="#8a6a3a" transform="rotate(-30 4166 950)"/>' +
      /* ボール */
      '<circle class="office-ppball" cx="0" cy="0" r="5" fill="#f6f4ee"/></g>');
    /* コーヒーキッチン(エスプレッソマシン・湯気) */
    s.push(pendant(4260, 88, 640)); s.push(pendant(4350, 88, 620));
    s.push('<g>' + shadow(4310, 950, 130, 18) +
      '<rect x="4200" y="820" width="220" height="118" rx="6" fill="#241f26" stroke="#151218" stroke-width="2"/>' +
      '<rect x="4192" y="806" width="236" height="22" rx="8" fill="url(#oBarTop)" stroke="#000" stroke-width="1.5"/>' +
      '<rect x="4192" y="808" width="236" height="4" rx="2" fill="#5a5a66" opacity="0.6"/>' +
      '<rect x="4212" y="774" width="12" height="34" rx="4" fill="#7a9a5a" opacity="0.9"/>' +
      '<rect x="4232" y="768" width="12" height="40" rx="4" fill="#9a6a4a" opacity="0.9"/>' +
      '<rect x="4252" y="778" width="12" height="30" rx="4" fill="#5a7a9a" opacity="0.9"/>' +
      /* エスプレッソマシン */
      '<rect x="4318" y="762" width="86" height="46" rx="6" fill="#8f959e" stroke="#5a5e66" stroke-width="2"/>' +
      '<rect x="4326" y="754" width="70" height="10" rx="4" fill="#6a6e76"/>' +
      '<rect x="4338" y="796" width="10" height="10" fill="#3a3e46"/><rect x="4372" y="796" width="10" height="10" fill="#3a3e46"/>' +
      '<circle cx="4396" cy="774" r="5" fill="#f0705f"/>' +
      '<rect x="4284" y="788" width="18" height="18" rx="3" fill="#f4efde"/><rect x="4284" y="788" width="18" height="4" rx="2" fill="#8a6a4a"/>' +
      '<path class="office-steam" d="M4292 782 C 4288 774, 4296 770, 4292 762" stroke="#dfe8ff" stroke-width="2.5" fill="none" opacity="0.6"/>' +
      '<path class="office-steam office-steam--2" d="M4352 748 C 4348 740, 4356 736, 4352 728" stroke="#dfe8ff" stroke-width="2.5" fill="none" opacity="0.5"/></g>');
    /* スツール */
    for (var stl = 0; stl < 3; stl++) {
      var stx = 4250 + stl * 62;
      s.push('<g>' + shadow(stx, 1000, 24, 8) +
        '<ellipse cx="' + stx + '" cy="960" rx="22" ry="9" fill="#6e3a28"/>' +
        '<ellipse cx="' + stx + '" cy="956" rx="22" ry="9" fill="#8a4c34"/>' +
        '<line x1="' + stx + '" y1="964" x2="' + stx + '" y2="996" stroke="#b08d4f" stroke-width="5"/>' +
        '<ellipse cx="' + stx + '" cy="997" rx="14" ry="4" fill="none" stroke="#b08d4f" stroke-width="3.5"/></g>');
    }

    /* ==== Zone 8: ライブラリ/集中ゾーン(4420-4940) ==== */
    s.push(rug(4740, 985, 380, 185, '#5a4a2e'));
    /* 天井まで届く書棚+はしご */
    s.push(bookshelf(4450, 900, 220, 780));
    s.push('<g opacity="0.9"><line x1="4652" y1="900" x2="4692" y2="330" stroke="#8a6a3a" stroke-width="7"/>' +
      '<line x1="4682" y1="900" x2="4722" y2="330" stroke="#8a6a3a" stroke-width="7"/>');
    for (var ld = 0; ld < 9; ld++) {
      var lt = ld / 8;
      s.push('<line x1="' + (4652 + 40 * lt).toFixed(1) + '" y1="' + (900 - 570 * lt).toFixed(1) + '" x2="' + (4682 + 40 * lt).toFixed(1) + '" y2="' + (900 - 570 * lt).toFixed(1) + '" stroke="#8a6a3a" stroke-width="6"/>');
    }
    s.push('</g>');
    /* 読書チェア+スタンドライト */
    s.push(loungeChair(4745, 1000));
    s.push(loungeChair(4858, 1048));
    s.push(standLamp(4920, 990));
    s.push('<g>' + shadow(4800, 1020, 24, 8) +
      '<ellipse cx="4800" cy="994" rx="24" ry="8" fill="url(#oWalnut)"/>' +
      '<line x1="4800" y1="1000" x2="4800" y2="1016" stroke="#241a10" stroke-width="5"/>' +
      '<rect x="4788" y="982" width="24" height="8" rx="2" fill="#7a4a3a"/><rect x="4790" y="976" width="20" height="7" rx="2" fill="#4a6a58"/></g>');
    s.push(plant(4432, 1044, 0.9, 'monstera'));

    /* ==== Zone 9: コーポレートウィング(4960-5480) ==== */
    s.push(rug(5140, 950, 400, 195, '#2f5a44'));
    s.push(bookshelf(4952, 900, 112, 228));
    /* 整然としたデスク */
    s.push('<g>' + shadow(5140, 898, 200, 22) +
      '<rect x="4960" y="842" width="360" height="30" rx="8" fill="url(#oWhiteTable)" stroke="#a89f8d" stroke-width="2"/>' +
      '<rect x="4980" y="872" width="13" height="36" fill="#3a3a42"/><rect x="5287" y="872" width="13" height="36" fill="#3a3a42"/></g>');
    s.push(monitor(5050, 838, 48, false)); s.push(monitor(5230, 838, 48, false));
    s.push(chair(5025, 950)); s.push(chair(5140, 950)); s.push(chair(5255, 950));
    s.push(chair(5085, 1030, '#3a4a40')); s.push(chair(5205, 1030, '#3a4a40'));
    /* 金庫(「¥0」の貼り紙=支出ゼロ運営) */
    s.push('<g>' + shadow(5400, 986, 46, 12) +
      '<rect x="5360" y="890" width="82" height="94" rx="6" fill="#454a54" stroke="#2b2e36" stroke-width="3"/>' +
      '<rect x="5368" y="898" width="66" height="78" rx="4" fill="#565c68"/>' +
      '<circle cx="5401" cy="936" r="13" fill="#3a3e46" stroke="#8a909c" stroke-width="3"/>' +
      '<line x1="5401" y1="936" x2="5409" y2="928" stroke="#c2c6ce" stroke-width="2.5"/>' +
      '<rect x="5375" y="902" width="34" height="24" rx="2" fill="#f4efde" transform="rotate(-4 5392 914)"/>' +
      '<text x="5392" y="920" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1C2C" font-family="sans-serif" transform="rotate(-4 5392 914)">¥0</text></g>');

    /* ==== Zone 10: 監査ブース(独立ガラス個室 5490-5770) ==== */
    s.push('<g>' +
      '<rect x="5492" y="640" width="7" height="420" fill="#101018"/>' +
      '<rect x="5708" y="640" width="7" height="420" fill="#101018"/>' +
      '<rect x="5492" y="640" width="223" height="5" fill="#101018"/>' +
      '<rect x="5499" y="645" width="209" height="415" fill="#9d85d2" opacity="0.09"/>' +
      '<path d="M5530 660 L5580 660 L5540 1040 L5490 1040 Z" fill="#dce8ff" opacity="0.05"/></g>');
    s.push('<text x="5604" y="676" text-anchor="middle" font-size="17" fill="#b8a8dd" font-family="sans-serif" letter-spacing="4" opacity="0.85">AUDIT</text>');
    s.push(pendant(5604, 88, 700, '#d9c8ff'));
    s.push('<g>' + shadow(5604, 900, 96, 15) +
      '<rect x="5520" y="848" width="168" height="26" rx="7" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<rect x="5536" y="874" width="12" height="30" fill="#241a10"/><rect x="5660" y="874" width="12" height="30" fill="#241a10"/></g>');
    s.push(monitor(5604, 844, 48, false));
    s.push(chair(5585, 960, '#443a5a'));
    s.push(plant(5748, 1042, 0.85, 'monstera'));

    /* ==== Zone 11: テラスガーデン(5800-6400) ==== */
    /* 室内との境界: ガラスの引き戸 */
    s.push('<g>' +
      '<rect x="' + (INT_END - 10) + '" y="60" width="20" height="1000" fill="#0b0e1d"/>' +
      '<rect x="' + (INT_END + 10) + '" y="86" width="90" height="654" fill="url(#oGlassPart)"/>' +
      '<rect x="' + (INT_END + 96) + '" y="86" width="8" height="654" fill="#101018"/>' +
      '<rect x="' + (INT_END + 10) + '" y="400" width="90" height="10" rx="4" fill="#2a2c38"/></g>');
    /* ガラスの手すり(デッキ奥) */
    s.push('<g><rect x="' + (INT_END + 104) + '" y="700" width="' + (6400 - INT_END - 104) + '" height="40" fill="#aac8e8" opacity="0.10"/>' +
      '<rect x="' + (INT_END + 104) + '" y="698" width="' + (6400 - INT_END - 104) + '" height="4" fill="#39446e"/>');
    for (var rp = INT_END + 130; rp < 6400; rp += 90) {
      s.push('<rect x="' + rp + '" y="700" width="4" height="40" fill="#39446e" opacity="0.8"/>');
    }
    s.push('</g>');
    /* ストリングライト(電球の連なり・2スパン) */
    s.push('<g><line x1="5860" y1="1050" x2="5860" y2="380" stroke="#2c2c34" stroke-width="8"/>' +
      '<line x1="6360" y1="1050" x2="6360" y2="380" stroke="#2c2c34" stroke-width="8"/>' +
      '<circle cx="5860" cy="376" r="6" fill="#17171d"/><circle cx="6360" cy="376" r="6" fill="#17171d"/>' +
      '<path d="M5860 385 Q6110 480 6360 385" stroke="#17171d" stroke-width="2.5" fill="none"/>' +
      '<path d="M5860 420 Q6110 540 6360 420" stroke="#17171d" stroke-width="2.5" fill="none"/>');
    s.push('<g class="office-nightlit">');
    for (var lb = 0; lb <= 8; lb++) {
      var lt2 = lb / 8;
      var lx = 5860 + 500 * lt2;
      var ly1 = 385 + Math.sin(Math.PI * lt2) * 71;
      var ly2 = 420 + Math.sin(Math.PI * lt2) * 90;
      s.push('<circle class="office-blb office-blb--' + (lb % 4) + '" cx="' + lx.toFixed(1) + '" cy="' + (ly1 + 10).toFixed(1) + '" r="6" fill="#ffdf9e"/>' +
        '<circle cx="' + lx.toFixed(1) + '" cy="' + (ly1 + 10).toFixed(1) + '" r="12" fill="#ffd88a" opacity="0.3" filter="url(#oBlurS)"/>');
      if (lb % 2 === 0) {
        s.push('<circle class="office-blb office-blb--' + ((lb + 2) % 4) + '" cx="' + lx.toFixed(1) + '" cy="' + (ly2 + 10).toFixed(1) + '" r="6" fill="#ffdf9e"/>' +
          '<circle cx="' + lx.toFixed(1) + '" cy="' + (ly2 + 10).toFixed(1) + '" r="12" fill="#ffd88a" opacity="0.3" filter="url(#oBlurS)"/>');
      }
    }
    s.push('</g>');
    s.push('</g>');
    /* 屋外ソファ+ローテーブル */
    s.push('<g>' + shadow(6010, 1010, 120, 17) +
      '<rect x="5900" y="912" width="220" height="36" rx="10" fill="#3c4a44"/>' +
      '<rect x="5892" y="940" width="236" height="46" rx="14" fill="#4a5a52"/>' +
      '<rect x="5884" y="922" width="18" height="56" rx="9" fill="#33403a"/><rect x="6118" y="922" width="18" height="56" rx="9" fill="#33403a"/>' +
      '<rect x="5916" y="946" width="58" height="24" rx="9" fill="#e8b84b" opacity="0.5"/><rect x="5990" y="946" width="58" height="24" rx="9" fill="#5e7268" opacity="0.9"/><rect x="6062" y="946" width="46" height="24" rx="9" fill="#8a4c34" opacity="0.7"/></g>');
    s.push('<g>' + shadow(6030, 1052, 52, 11) +
      '<rect x="5980" y="1020" width="100" height="16" rx="6" fill="#5a4028"/>' +
      '<rect x="5992" y="1036" width="10" height="18" fill="#33230f"/><rect x="6058" y="1036" width="10" height="18" fill="#33230f"/>' +
      '<circle cx="6018" cy="1014" r="7" fill="#ffdf9e"/><ellipse cx="6018" cy="1014" rx="16" ry="10" fill="url(#oLampGlow)" filter="url(#oBlurS)"/></g>'); /* ランタン */
    /* 植栽(夜風でゆらぐ) */
    s.push('<g class="office-sway" style="transform-origin:6200px 1040px">' + plant(6200, 1040, 1.15, 'monstera') + '</g>');
    s.push('<g class="office-sway office-sway--2" style="transform-origin:6330px 1010px">' + plant(6330, 1010, 0.95, 'olive') + '</g>');
    s.push('<g class="office-sway office-sway--3" style="transform-origin:5876px 1000px">' + plant(5876, 1000, 0.8, 'olive') + '</g>');
    /* デッキの光だまり(電球色) */
    s.push('<ellipse cx="6110" cy="990" rx="260" ry="110" fill="url(#oPool)" filter="url(#oBlurM)" opacity="0.8"/>');

    s.push('</g>'); /* translate(OWNER_W) 終わり */

    /* エレベーター(1F・テラス右端の展望エレベーター) */
    s.push(elevatorSVG('officeElev1F', '1F', 'oBlurM'));

    /* 昼夜サイクル: 室内の色被せ(朝の斜光/昼の外光/夕日の反射) */
    s.push(sceneWashSVG(VW, false));

    /* 全体の空気(手前をわずかに暗く締める) */
    s.push('<rect x="0" y="1060" width="' + VW + '" height="40" fill="#000" opacity="0.28" filter="url(#oBlurM)"/>');

    /* ゾーンの床際ネームプレート(常時表示) */
    ZONES.forEach(function (z) {
      var cx = (z.x0 + z.x1) / 2;
      s.push('<text class="office-zlabel" x="' + cx + '" y="1087" text-anchor="middle"' +
        ' font-family="sans-serif" font-size="17" letter-spacing="1.5"' +
        ' fill="#e9ecf7" stroke="#060a1c" stroke-width="4" paint-order="stroke" opacity="0.82">' +
        '<tspan fill="' + z.color + '">&#9679;</tspan> ' + esc(z.en) + ' / ' + esc(z.label) + '</text>');
    });

    s.push('</svg>');
    return s.join('');
  }

  /* ============================================================
     RFレイヤー: ルーフトップ・スカイラウンジ 7100 x 1100
     (屋上=天井なし。パラペット越しに夜景/空が透ける)
     ============================================================ */
  function buildRoofSVG() {
    var s = [];
    s.push('<svg class="office-bg" viewBox="0 0 ' + VW + ' 1100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');

    s.push('<defs>');
    s.push('<linearGradient id="rWater" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3d9cc4"/><stop offset="0.55" stop-color="#2277a0"/><stop offset="1" stop-color="#155a7e"/></linearGradient>');
    s.push('<radialGradient id="rFireGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffab58" stop-opacity="0.75"/><stop offset="0.5" stop-color="#ff8a3e" stop-opacity="0.28"/>' +
      '<stop offset="1" stop-color="#ff8a3e" stop-opacity="0"/></radialGradient>');
    s.push('<linearGradient id="rBarBack" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffca7a" stop-opacity="0.34"/><stop offset="1" stop-color="#b5722e" stop-opacity="0.12"/></linearGradient>');
    s.push('<radialGradient id="rPool" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffca7a" stop-opacity="0.30"/><stop offset="0.7" stop-color="#ffb85c" stop-opacity="0.10"/>' +
      '<stop offset="1" stop-color="#ffb85c" stop-opacity="0"/></radialGradient>');
    s.push('<pattern id="rDeck" width="220" height="44" patternUnits="userSpaceOnUse" patternTransform="translate(0 744)">' +
      '<rect width="220" height="44" fill="#5a4028"/>' +
      '<rect x="0" y="0" width="220" height="20" fill="#65482d"/>' +
      '<rect x="0" y="22" width="220" height="20" fill="#4e371f"/>' +
      '<path d="M0 21 L220 21 M0 43 L220 43" stroke="#33230f" stroke-width="2"/>' +
      '<path d="M110 0 L110 21 M40 22 L40 43 M180 22 L180 43" stroke="#33230f" stroke-width="2"/></pattern>');
    s.push('<filter id="rBlurS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>');
    s.push('<filter id="rBlurM" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>');
    s.push('</defs>');

    function sh(cx, cy, rx, ry) {
      return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (ry || rx * 0.28) + '" fill="#000" opacity="0.32" filter="url(#rBlurS)"/>';
    }
    function rplant(x, y, sc) {
      sc = sc || 1;
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')">' + sh(0, 4, 34, 10) +
        '<path d="M-26 0 L26 0 L20 -44 L-20 -44 Z" fill="#2b2620"/><rect x="-22" y="-48" width="44" height="6" rx="2" fill="#3a332b"/>' +
        '<path d="M0 -44 C-30 -70 -52 -66 -60 -104 C-30 -100 -16 -84 -4 -60 Z" fill="#3f7048"/>' +
        '<path d="M0 -44 C28 -76 52 -72 62 -112 C30 -106 14 -86 4 -60 Z" fill="#4c8455"/>' +
        '<path d="M0 -46 C-8 -92 -16 -110 -2 -148 C14 -112 10 -88 4 -58 Z" fill="#579262"/></g>';
    }
    function lounger(x, y) {
      return '<g>' + sh(x, y + 4, 74, 13) +
        '<path d="M' + (x - 80) + ' ' + (y - 24) + ' L' + (x + 30) + ' ' + (y - 24) + ' L' + (x + 76) + ' ' + (y - 72) + '" stroke="#8a4c34" stroke-width="16" fill="none" stroke-linecap="round"/>' +
        '<path d="M' + (x - 76) + ' ' + (y - 30) + ' L' + (x + 26) + ' ' + (y - 30) + '" stroke="#a05a3e" stroke-width="7" stroke-linecap="round"/>' +
        '<line x1="' + (x - 58) + '" y1="' + (y - 16) + '" x2="' + (x - 58) + '" y2="' + y + '" stroke="#5d3021" stroke-width="7"/>' +
        '<line x1="' + (x + 24) + '" y1="' + (y - 16) + '" x2="' + (x + 24) + '" y2="' + y + '" stroke="#5d3021" stroke-width="7"/>' +
        '<rect x="' + (x - 76) + '" y="' + (y - 36) + '" width="56" height="11" rx="5" fill="#f4efde" opacity="0.55"/></g>';
    }
    function armchair(x, y, col, dark) {
      return '<g>' + sh(x, y + 4, 40, 11) +
        '<rect x="' + (x - 34) + '" y="' + (y - 66) + '" width="68" height="38" rx="13" fill="' + col + '"/>' +
        '<rect x="' + (x - 38) + '" y="' + (y - 36) + '" width="76" height="26" rx="11" fill="' + dark + '"/>' +
        '<rect x="' + (x - 44) + '" y="' + (y - 48) + '" width="12" height="34" rx="6" fill="' + dark + '"/>' +
        '<rect x="' + (x + 32) + '" y="' + (y - 48) + '" width="12" height="34" rx="6" fill="' + dark + '"/></g>';
    }
    function stool(x, y) {
      return '<g>' + sh(x, y + 2, 24, 8) +
        '<ellipse cx="' + x + '" cy="' + (y - 40) + '" rx="22" ry="9" fill="#6e3a28"/>' +
        '<ellipse cx="' + x + '" cy="' + (y - 44) + '" rx="22" ry="9" fill="#8a4c34"/>' +
        '<line x1="' + x + '" y1="' + (y - 36) + '" x2="' + x + '" y2="' + (y - 4) + '" stroke="url(#oBrass)" stroke-width="5"/>' +
        '<ellipse cx="' + x + '" cy="' + (y - 3) + '" rx="14" ry="4" fill="none" stroke="url(#oBrass)" stroke-width="3.5"/></g>';
    }

    /* ===== パラペット(ガラスの手すり)— 奥の縁 ===== */
    s.push('<rect x="0" y="588" width="' + VW + '" height="10" fill="#2c2c34"/>');
    s.push('<rect x="0" y="598" width="' + VW + '" height="142" fill="#aac8e8" opacity="0.09"/>');
    for (var pp = 40; pp < VW; pp += 236) {
      s.push('<rect x="' + pp + '" y="598" width="5" height="142" fill="#39446e" opacity="0.8"/>');
    }
    s.push('<rect x="0" y="596" width="' + VW + '" height="3" fill="#dce8ff" opacity="0.25"/>');

    /* ===== 床(ウッドデッキ全面) ===== */
    s.push('<rect x="0" y="740" width="' + VW + '" height="360" fill="#4e371f"/>');
    s.push('<rect x="0" y="740" width="' + VW + '" height="360" fill="url(#rDeck)" opacity="0.9"/>');
    /* 夜の光だまり */
    s.push('<g class="office-lights">' +
      '<ellipse cx="1800" cy="990" rx="300" ry="120" fill="url(#rPool)" filter="url(#rBlurM)"/>' +
      '<ellipse cx="4820" cy="1000" rx="300" ry="125" fill="url(#rPool)" filter="url(#rBlurM)"/>' +
      '<ellipse cx="6100" cy="980" rx="360" ry="130" fill="url(#rPool)" filter="url(#rBlurM)"/></g>');

    /* ===== Zone R1: ヘリポート(0-1340) ===== */
    s.push('<g>' +
      '<ellipse cx="660" cy="950" rx="440" ry="138" fill="#3f4450" stroke="#2c3038" stroke-width="5"/>' +
      '<ellipse cx="660" cy="950" rx="336" ry="102" fill="none" stroke="#e9ecf7" stroke-width="6" stroke-dasharray="46 30" opacity="0.55"/>' +
      '<text x="660" y="1016" text-anchor="middle" font-size="180" font-family="sans-serif" font-weight="bold" fill="#e9ecf7" opacity="0.82">H</text>');
    for (var hl = 0; hl < 8; hl++) {
      var ha = hl * Math.PI / 4;
      s.push('<circle class="office-helilight office-helilight--' + (hl % 4) + '" cx="' + (660 + Math.cos(ha) * 420).toFixed(1) + '" cy="' + (950 + Math.sin(ha) * 128).toFixed(1) + '" r="7" fill="#ffb54e"/>');
    }
    s.push('</g>');
    /* 吹き流し */
    s.push('<g>' + sh(140, 862, 20, 7) +
      '<line x1="140" y1="860" x2="140" y2="700" stroke="#4a4e58" stroke-width="6"/>' +
      '<g class="office-windsock" style="transform-origin:140px 706px"><path d="M140 700 L226 706 L222 722 L140 718 Z" fill="#F0705F"/>' +
      '<path d="M162 701.5 L184 703 L184 719.5 L162 718 Z" fill="#f4efde"/></g></g>');

    /* ===== Zone R2: サンデッキ(1340-2480) ===== */
    s.push(lounger(1620, 1000));
    s.push(lounger(1950, 1022));
    /* サイドテーブル+ドリンク */
    s.push('<g>' + sh(1790, 1010, 26, 8) +
      '<ellipse cx="1790" cy="982" rx="26" ry="9" fill="url(#oWalnut)"/>' +
      '<line x1="1790" y1="988" x2="1790" y2="1006" stroke="#241a10" stroke-width="5"/>' +
      '<rect x="1778" y="964" width="9" height="16" rx="2" fill="#ffd88a" opacity="0.9"/>' +
      '<rect x="1794" y="966" width="9" height="14" rx="2" fill="#8adfff" opacity="0.85"/></g>');
    /* パラソル(たたみ気味) */
    s.push('<g>' + sh(2114, 1004, 18, 6) +
      '<line x1="2114" y1="1002" x2="2114" y2="790" stroke="#b08d4f" stroke-width="7"/>' +
      '<path d="M2114 790 L2060 900 L2088 902 L2114 812 L2140 902 L2168 900 Z" fill="#c96f4a"/>' +
      '<circle cx="2114" cy="786" r="7" fill="#8a6a3a"/></g>');
    /* 望遠鏡(パラペット際・夜景/海を眺める) */
    s.push('<g>' + sh(2260, 946, 34, 9) +
      '<line x1="2260" y1="942" x2="2240" y2="880" stroke="#3a3a44" stroke-width="5"/>' +
      '<line x1="2260" y1="942" x2="2280" y2="884" stroke="#3a3a44" stroke-width="5"/>' +
      '<line x1="2260" y1="942" x2="2260" y2="878" stroke="#3a3a44" stroke-width="5"/>' +
      '<g transform="rotate(-20 2260 872)"><rect x="2222" y="862" width="86" height="18" rx="8" fill="url(#oBrass)" stroke="#7a5f30" stroke-width="2"/>' +
      '<rect x="2208" y="864" width="18" height="14" rx="5" fill="#8a6a3a"/>' +
      '<circle cx="2310" cy="871" r="7" fill="#2a2e44" stroke="#b08d4f" stroke-width="2"/></g></g>');

    /* ===== Zone R3: インフィニティプール(2480-4220・キャラ動線の奥) ===== */
    s.push('<g>' + sh(3350, 916, 620, 26) +
      '<rect x="2500" y="752" width="1700" height="158" rx="16" fill="#cfc8bb" stroke="#a89f8d" stroke-width="3"/>' +
      '<rect x="2520" y="766" width="1660" height="130" rx="10" fill="url(#rWater)"/>' +
      /* インフィニティエッジ(奥の縁が夜景に溶ける) */
      '<rect x="2520" y="764" width="1660" height="6" fill="#bfe9ff" opacity="0.75" class="office-poolglow"/>' +
      /* 水面のゆらぎ */
      '<path class="office-poolwave" d="M2560 800 Q2640 792 2720 800 T2880 800 T3040 800 T3200 800 T3360 800 T3520 800 T3680 800 T3840 800 T4000 800 T4140 800" stroke="#dff4ff" stroke-width="3" fill="none" opacity="0.35"/>' +
      '<path class="office-poolwave office-poolwave--2" d="M2560 842 Q2650 834 2740 842 T3100 842 T3460 842 T3820 842 T4140 842" stroke="#cfeaff" stroke-width="2.5" fill="none" opacity="0.28"/>' +
      /* 水中照明(夜) */
      '<g class="office-nightlit">' +
      '<circle cx="2760" cy="866" r="16" fill="#9fe0ff" opacity="0.55" filter="url(#rBlurS)"/>' +
      '<circle cx="3220" cy="866" r="16" fill="#9fe0ff" opacity="0.55" filter="url(#rBlurS)"/>' +
      '<circle cx="3680" cy="866" r="16" fill="#9fe0ff" opacity="0.55" filter="url(#rBlurS)"/>' +
      '<circle cx="4080" cy="866" r="16" fill="#9fe0ff" opacity="0.55" filter="url(#rBlurS)"/></g>' +
      /* 浮き輪 */
      '<g class="office-float"><circle cx="3070" cy="828" r="24" fill="none" stroke="#F0705F" stroke-width="12"/>' +
      '<circle cx="3070" cy="828" r="24" fill="none" stroke="#f4efde" stroke-width="12" stroke-dasharray="12 26"/></g>' +
      /* ラダー */
      '<g stroke="#c2c6ce" stroke-width="5" fill="none"><path d="M4126 762 L4126 886 M4154 762 L4154 886"/>' +
      '<path d="M4126 800 L4154 800 M4126 836 L4154 836 M4126 870 L4154 870" stroke-width="4"/></g>' +
      '</g>');

    /* ===== Zone R4: ファイヤーピット(4220-5430) ===== */
    s.push('<rect x="4420" y="920" width="800" height="170" rx="20" fill="#6a4a30" opacity="0.35"/>');
    s.push('<g>' + sh(4820, 995, 70, 20) +
      '<ellipse cx="4820" cy="985" rx="66" ry="25" fill="#55504a" stroke="#3a352e" stroke-width="4"/>' +
      '<ellipse cx="4820" cy="982" rx="48" ry="17" fill="#241d15"/>' +
      '<rect x="4794" y="968" width="30" height="9" rx="4" fill="#6b4a2f" transform="rotate(-14 4809 972)"/>' +
      '<rect x="4816" y="966" width="30" height="9" rx="4" fill="#5d3f28" transform="rotate(18 4831 970)"/>' +
      /* 炎(夕・夜のみ) */
      '<g class="office-firelit">' +
      '<ellipse cx="4820" cy="942" rx="95" ry="62" fill="url(#rFireGlow)" filter="url(#rBlurM)"/>' +
      '<path class="office-flame" d="M4806 972 C4796 950 4808 934 4818 916 C4826 934 4840 946 4832 966 C4828 976 4812 978 4806 972 Z" fill="#ff8a3e"/>' +
      '<path class="office-flame office-flame--2" d="M4814 968 C4808 952 4818 942 4822 928 C4830 944 4834 954 4828 966 C4824 972 4818 972 4814 968 Z" fill="#ffce6a"/>' +
      '</g></g>');
    s.push(armchair(4640, 1008, '#5a4632', '#4a3826'));
    s.push(armchair(5000, 1008, '#5a4632', '#4a3826'));
    s.push(armchair(4730, 1058, '#6e5640', '#4a3826'));
    s.push(armchair(4915, 1058, '#6e5640', '#4a3826'));
    /* ランタン */
    s.push('<g>' + sh(5120, 1010, 16, 6) +
      '<rect x="5108" y="964" width="24" height="36" rx="5" fill="#2c2c34" stroke="#17171d" stroke-width="2"/>' +
      '<circle cx="5120" cy="982" r="7" fill="#ffdf9e"/><ellipse cx="5120" cy="982" rx="18" ry="12" fill="url(#oLampGlow)" filter="url(#rBlurS)"/></g>');

    /* ===== 緑化壁(バーの左外壁) ===== */
    s.push('<g>' + sh(5495, 1046, 50, 11) +
      '<rect x="5440" y="640" width="112" height="406" rx="8" fill="#22301f" stroke="#18220f" stroke-width="4"/>');
    for (var gv = 0; gv < 24; gv++) {
      var gvx = 5452 + (gv % 4) * 24, gvy = 654 + Math.floor(gv / 4) * 62;
      var gvc = ['#3f7048', '#4c8455', '#579262', '#65a06a'][gv % 4];
      s.push('<ellipse cx="' + (gvx + 10) + '" cy="' + (gvy + 16) + '" rx="14" ry="11" fill="' + gvc + '"/>' +
        '<ellipse cx="' + (gvx + 18) + '" cy="' + (gvy + 28) + '" rx="10" ry="8" fill="' + gvc + '" opacity="0.8"/>');
    }
    s.push('</g>');

    /* ===== Zone R5: スカイバー(ガラスの箱型ラウンジ 5560-6900) ===== */
    /* 屋根スラブ+エッジ照明 */
    s.push('<rect x="5540" y="556" width="1380" height="36" rx="8" fill="#14100d"/>');
    s.push('<rect x="5540" y="588" width="1380" height="8" fill="#ffca7a" opacity="0.35" filter="url(#rBlurS)"/>');
    /* ガラス壁+方立 */
    s.push('<rect x="5548" y="592" width="1364" height="456" fill="#aac8e8" opacity="0.07"/>');
    for (var bm = 5548; bm <= 6912; bm += 272) {
      s.push('<rect x="' + (bm - 4) + '" y="592" width="8" height="456" fill="#0b0e1d"/>');
    }
    s.push('<path d="M5640 600 L5760 600 L5640 1040 L5520 1040 Z" fill="#dce8ff" opacity="0.05"/>');
    s.push('<path d="M6560 600 L6640 600 L6520 1040 L6440 1040 Z" fill="#dce8ff" opacity="0.05"/>');
    /* 室内の空気(わずかに暖色) */
    s.push('<rect x="5556" y="740" width="1348" height="330" fill="#2a1c10" opacity="0.30"/>');
    /* ネオンサイン */
    s.push('<text x="6230" y="646" text-anchor="middle" font-size="26" fill="#ffce6a" font-family="sans-serif" letter-spacing="8" class="office-sign-glow">SKY BAR</text>');
    /* 酒棚(バックライト) */
    s.push('<g>' + sh(5920, 872, 240, 16) +
      '<rect x="5640" y="640" width="560" height="224" rx="6" fill="#241c14" stroke="#17100c" stroke-width="3"/>' +
      '<g class="office-nightlit"><rect x="5652" y="652" width="536" height="200" fill="url(#rBarBack)"/></g>' +
      '<rect x="5652" y="742" width="536" height="6" fill="#17100c"/>' +
      '<rect x="5652" y="846" width="536" height="6" fill="#17100c"/>');
    var btlCols = ['#c9862e', '#7a4a3a', '#4a6a58', '#9aa64e', '#5a7a9a', '#a05a4a', '#caa55d', '#6a4a5a'];
    for (var bt = 0; bt < 15; bt++) {
      var btx = 5672 + bt * 34;
      s.push('<rect x="' + btx + '" y="' + (698 - (bt % 3) * 8) + '" width="14" height="' + (42 + (bt % 3) * 8) + '" rx="4" fill="' + btlCols[bt % 8] + '"/>' +
        '<rect x="' + (btx + 4) + '" y="' + (688 - (bt % 3) * 8) + '" width="6" height="12" fill="' + btlCols[bt % 8] + '"/>');
    }
    for (var bt2 = 0; bt2 < 15; bt2++) {
      var btx2 = 5672 + bt2 * 34;
      s.push('<rect x="' + btx2 + '" y="' + (804 - (bt2 % 2) * 6) + '" width="14" height="' + (40 + (bt2 % 2) * 6) + '" rx="4" fill="' + btlCols[(bt2 + 3) % 8] + '"/>');
    }
    s.push('</g>');
    /* バーカウンター(黒御影+真鍮+ウォールナット) */
    s.push('<g>' + sh(5975, 986, 380, 22) +
      '<rect x="5620" y="882" width="710" height="96" rx="4" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<rect x="5600" y="862" width="750" height="22" rx="9" fill="url(#oBarTop)" stroke="#000" stroke-width="1.5"/>' +
      '<rect x="5600" y="864" width="750" height="4" rx="2" fill="url(#oBrass)" opacity="0.9"/>' +
      '<rect x="5620" y="962" width="710" height="5" fill="url(#oBrass)" opacity="0.7"/>' +
      /* グラス・シェイカー・カクテル */
      '<path d="M5760 842 L5784 842 L5772 858 Z" fill="#bcd7ff" opacity="0.85"/><line x1="5772" y1="858" x2="5772" y2="866" stroke="#bcd7ff" stroke-width="2.5"/>' +
      '<rect x="5920" y="836" width="16" height="26" rx="5" fill="#8f959e"/>' +
      '<rect x="6080" y="842" width="12" height="20" rx="3" fill="#ffd88a" opacity="0.9"/>' +
      '<path d="M6210 844 L6234 844 L6222 860 Z" fill="#ff9ac9" opacity="0.85"/><line x1="6222" y1="860" x2="6222" y2="866" stroke="#bcd7ff" stroke-width="2.5"/></g>');
    s.push(stool(5730, 1000)); s.push(stool(5890, 1000)); s.push(stool(6050, 1000));
    /* ペンダントライト x3(屋根から) */
    for (var pd = 0; pd < 3; pd++) {
      var pdx = 5780 + pd * 210;
      s.push('<g><line x1="' + pdx + '" y1="592" x2="' + pdx + '" y2="700" stroke="#2a2c38" stroke-width="3"/>' +
        '<path d="M' + (pdx - 20) + ' 718 L' + (pdx - 6) + ' 700 L' + (pdx + 6) + ' 700 L' + (pdx + 20) + ' 718 Z" fill="#1c1c22" stroke="#3a3a44" stroke-width="2"/>' +
        '<ellipse cx="' + pdx + '" cy="718" rx="18" ry="5" fill="#ffdf9e"/>' +
        '<ellipse cx="' + pdx + '" cy="728" rx="32" ry="18" fill="url(#oLampGlow)" filter="url(#rBlurS)"/></g>');
    }
    /* ラウンジソファ+ローテーブル+スタンドライト */
    s.push('<g>' + sh(6560, 1046, 130, 18) +
      '<rect x="6440" y="948" width="240" height="36" rx="10" fill="#3c3552"/>' +
      '<rect x="6432" y="976" width="256" height="46" rx="14" fill="#4a4266"/>' +
      '<rect x="6424" y="958" width="18" height="56" rx="9" fill="#332c48"/><rect x="6678" y="958" width="18" height="56" rx="9" fill="#332c48"/>' +
      '<rect x="6462" y="982" width="58" height="24" rx="9" fill="#E8B84B" opacity="0.55"/><rect x="6538" y="982" width="58" height="24" rx="9" fill="#5e5678" opacity="0.9"/><rect x="6612" y="982" width="46" height="24" rx="9" fill="#8a4c34" opacity="0.7"/></g>');
    s.push('<g>' + sh(6560, 1078, 50, 10) +
      '<ellipse cx="6560" cy="1054" rx="52" ry="13" fill="url(#oWalnut)"/>' +
      '<rect x="6536" y="1062" width="8" height="14" fill="#241a10"/><rect x="6578" y="1062" width="8" height="14" fill="#241a10"/>' +
      '<circle cx="6580" cy="1046" r="6" fill="#8a6a4a"/><rect x="6540" y="1042" width="18" height="9" rx="2" fill="#f4efde"/></g>');
    s.push('<g>' + sh(6790, 1014, 24, 8) +
      '<line x1="6790" y1="1012" x2="6790" y2="876" stroke="url(#oBrass)" stroke-width="5"/>' +
      '<path d="M6766 876 L6814 876 L6804 848 L6776 848 Z" fill="#caa55d"/>' +
      '<ellipse cx="6790" cy="878" rx="22" ry="6" fill="#ffdf9e"/>' +
      '<ellipse cx="6790" cy="902" rx="48" ry="36" fill="url(#oLampGlow)" filter="url(#rBlurM)"/></g>');

    /* ===== ストリングライト(サンデッキ〜ファイヤーピット・3スパン) ===== */
    var slPoles = [1360, 2500, 4210, 5430];
    s.push('<g>');
    for (var sp2 = 0; sp2 < slPoles.length; sp2++) {
      s.push('<line x1="' + slPoles[sp2] + '" y1="1050" x2="' + slPoles[sp2] + '" y2="416" stroke="#2c2c34" stroke-width="8"/>' +
        '<circle cx="' + slPoles[sp2] + '" cy="412" r="6" fill="#17171d"/>');
    }
    for (var spn = 0; spn < slPoles.length - 1; spn++) {
      var xa = slPoles[spn], xb = slPoles[spn + 1];
      s.push('<path d="M' + xa + ' 420 Q' + ((xa + xb) / 2) + ' ' + (420 + (xb - xa) * 0.10) + ' ' + xb + ' 420" stroke="#17171d" stroke-width="2.5" fill="none"/>');
      s.push('<g class="office-nightlit">');
      for (var bl2 = 1; bl2 < 9; bl2++) {
        var t3 = bl2 / 9;
        var bx3 = xa + (xb - xa) * t3;
        var by3 = 420 + Math.sin(Math.PI * t3) * (xb - xa) * 0.05 + 10;
        s.push('<circle class="office-blb office-blb--' + (bl2 % 4) + '" cx="' + bx3.toFixed(1) + '" cy="' + by3.toFixed(1) + '" r="6" fill="#ffdf9e"/>' +
          '<circle cx="' + bx3.toFixed(1) + '" cy="' + by3.toFixed(1) + '" r="12" fill="#ffd88a" opacity="0.3" filter="url(#rBlurS)"/>');
      }
      s.push('</g>');
    }
    s.push('</g>');

    /* 植栽(夜風でゆらぐ) */
    s.push('<g class="office-sway" style="transform-origin:1385px 1040px">' + rplant(1385, 1040, 1.1) + '</g>');
    s.push('<g class="office-sway office-sway--2" style="transform-origin:4265px 1030px">' + rplant(4265, 1030, 0.95) + '</g>');
    s.push('<g class="office-sway office-sway--3" style="transform-origin:6900px 1042px">' + rplant(6900, 1042, 1.0) + '</g>');

    /* エレベーター(RF) */
    s.push(elevatorSVG('officeElevRF', 'RF', 'rBlurM'));

    /* 昼夜サイクル: 屋外ウォッシュ */
    s.push(sceneWashSVG(VW, true));

    /* 手前を締める */
    s.push('<rect x="0" y="1060" width="' + VW + '" height="40" fill="#000" opacity="0.28" filter="url(#rBlurM)"/>');

    /* ゾーンの床際ネームプレート */
    RF_ZONES.forEach(function (z) {
      var cx = (z.x0 + z.x1) / 2;
      s.push('<text class="office-zlabel" x="' + cx + '" y="1087" text-anchor="middle"' +
        ' font-family="sans-serif" font-size="17" letter-spacing="1.5"' +
        ' fill="#e9ecf7" stroke="#060a1c" stroke-width="4" paint-order="stroke" opacity="0.82">' +
        '<tspan fill="' + z.color + '">&#9679;</tspan> ' + esc(z.en) + ' / ' + esc(z.label) + '</text>');
    });

    s.push('</svg>');
    return s.join('');
  }

  /* ---------- ユーティリティ ---------- */
  function relTime(iso) {
    if (!iso) return null;
    var t = Date.parse(iso);
    if (isNaN(t)) return null;
    var diff = Math.max(0, Date.now() - t);
    var m = Math.floor(diff / 60000);
    if (m < 1) return 'たった今';
    if (m < 60) return m + '分前';
    var h = Math.floor(m / 60);
    if (h < 24) return h + '時間前';
    return Math.floor(h / 24) + '日前';
  }
  function yen(n) {
    if (typeof n !== 'number') return '—';
    return (n < 0 ? '-¥' : '¥') + Math.abs(n).toLocaleString('ja-JP');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  /* 現在時刻(JST・HH:MM)。Intl非対応環境はUTC+9で計算 */
  function jstNow() {
    try {
      return new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) {
      var d = new Date(Date.now() + 9 * 3600000);
      return pad2(d.getUTCHours()) + ':' + pad2(d.getUTCMinutes());
    }
  }
  /* ISO時刻 → 「◯月◯日 ◯時◯分」(JST) */
  function jstStamp(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return null;
    try {
      var parts = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date(t));
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      if (o.month && o.day && o.hour != null && o.minute != null) {
        return Number(o.month) + '月' + Number(o.day) + '日 ' + Number(o.hour) + '時' + Number(o.minute) + '分';
      }
    } catch (e) { /* fallthrough */ }
    var d = new Date(t + 9 * 3600000);
    return (d.getUTCMonth() + 1) + '月' + d.getUTCDate() + '日 ' + d.getUTCHours() + '時' + d.getUTCMinutes() + '分';
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  /* ---------- DOM構築 ---------- */
  var tabsEl = root.querySelector('.office-tabs');
  var sceneEl = root.querySelector('.office-scene');
  sceneEl.innerHTML = '';
  sceneEl.setAttribute('tabindex', '0');
  /* overflow:hidden の器はフォーカス移動で内部スクロールされ得る
     (2フロア化で上下にもはみ出すため顕在化)。位置はtransformで
     管理しているので、内部スクロールは常に0へ戻す */
  sceneEl.addEventListener('scroll', function () {
    sceneEl.scrollLeft = 0;
    sceneEl.scrollTop = 0;
  });

  /* 遠景(パララックス)レイヤー */
  var farEl = document.createElement('div');
  farEl.className = 'office-far';
  farEl.innerHTML = buildFarSVG();
  sceneEl.appendChild(farEl);

  var worldEl = document.createElement('div');
  worldEl.className = 'office-world';
  sceneEl.appendChild(worldEl);

  /* 2フロア構造: RF(上)+1F(下)を縦に積み、translateYで切替 */
  var floorsEl = document.createElement('div');
  floorsEl.className = 'office-floors';
  worldEl.appendChild(floorsEl);

  var rfEl = document.createElement('div');
  rfEl.className = 'office-floor office-floor--rf';
  rfEl.innerHTML = buildRoofSVG();
  floorsEl.appendChild(rfEl);

  var f1El = document.createElement('div');
  f1El.className = 'office-floor office-floor--1f';
  f1El.innerHTML = buildInteriorSVG();
  floorsEl.appendChild(f1El);

  var stageEl = document.createElement('div');
  stageEl.className = 'office-stage';
  f1El.appendChild(stageEl);

  var rfStageEl = document.createElement('div');
  rfStageEl.className = 'office-stage';
  rfEl.appendChild(rfStageEl);

  var curFloor = '1f';

  var hudEl = document.createElement('div');
  hudEl.className = 'office-hud';
  sceneEl.appendChild(hudEl);

  var tipEl = document.createElement('div');
  tipEl.className = 'office-tip';
  tipEl.setAttribute('role', 'status');
  sceneEl.appendChild(tipEl);

  var panelEl = document.createElement('aside');
  panelEl.className = 'office-panel';
  sceneEl.appendChild(panelEl);

  /* パンのヒント矢印+ズームボタン */
  var hintL = document.createElement('div');
  hintL.className = 'office-hint office-hint--l';
  hintL.innerHTML = '&#8249;';
  var hintR = document.createElement('div');
  hintR.className = 'office-hint office-hint--r';
  hintR.innerHTML = '&#8250;';
  sceneEl.appendChild(hintL);
  sceneEl.appendChild(hintR);

  var zoomWrap = document.createElement('div');
  zoomWrap.className = 'office-zoom';
  zoomWrap.innerHTML =
    '<button type="button" class="office-zoom__btn" data-z="1" aria-label="拡大">+</button>' +
    '<button type="button" class="office-zoom__btn" data-z="-1" aria-label="縮小">−</button>';
  sceneEl.appendChild(zoomWrap);

  /* データ鮮度(dashboard.json の generated_at から。取得失敗時は非表示) */
  var freshEl = document.createElement('div');
  freshEl.className = 'office-fresh';
  freshEl.style.display = 'none';
  zoomWrap.insertBefore(freshEl, zoomWrap.firstChild);
  var freshAt = null;
  function renderFresh() {
    var r = freshAt ? relTime(freshAt) : null;
    if (r) {
      freshEl.textContent = 'データ更新: ' + r;
      freshEl.style.display = '';
    } else {
      freshEl.style.display = 'none';
    }
  }

  /* フルスクリーンボタン(非対応環境=iOS Safari等では出さない) */
  var fsBtn = null;
  (function initFullscreen() {
    var reqFn = sceneEl.requestFullscreen || sceneEl.webkitRequestFullscreen;
    if (!reqFn) return; /* iOS Safari 等の非対応環境ではボタン自体を出さない */
    if ('fullscreenEnabled' in document && !document.fullscreenEnabled && !document.webkitFullscreenEnabled) return;
    fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'office-zoom__btn office-fs-btn';
    fsBtn.setAttribute('aria-label', 'フルスクリーン');
    fsBtn.textContent = '⛶';
    zoomWrap.insertBefore(fsBtn, freshEl.nextSibling);
    function fsElement() {
      return document.fullscreenElement || document.webkitFullscreenElement || null;
    }
    fsBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      try {
        if (fsElement()) {
          var exitFn = document.exitFullscreen || document.webkitExitFullscreen;
          if (exitFn) exitFn.call(document);
        } else {
          var p = reqFn.call(sceneEl);
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) { /* 失敗しても他機能に影響させない */ }
    });
    function onFsChange() {
      var on = !!fsElement();
      sceneEl.classList.toggle('is-fullscreen', on);
      fsBtn.setAttribute('aria-label', on ? 'フルスクリーン解除' : 'フルスクリーン');
      fsBtn.classList.toggle('is-active', on);
      layout();
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
  })();

  var dragNote = document.createElement('div');
  dragNote.className = 'office-dragnote';
  dragNote.textContent = '← ドラッグで移動 →';
  sceneEl.appendChild(dragNote);

  /* ---------- 昼夜サイクル(JST・4シーン・2秒フェード) ---------- */
  var SCENES = ['morning', 'day', 'evening', 'night'];
  var SCENE_ICON = { morning: '🌅', day: '☀️', evening: '🌆', night: '🌃' };
  var SCENE_NAME = { morning: '朝', day: '昼', evening: '夕', night: '夜' };
  var curScene = null;
  var scenePreviewTimer = null;

  function jstHourNow() {
    return new Date(Date.now() + 9 * 3600000).getUTCHours();
  }
  function sceneForHour(h) {
    if (h >= 5 && h < 10) return 'morning';
    if (h >= 10 && h < 16) return 'day';
    if (h >= 16 && h < 19) return 'evening';
    return 'night';
  }
  /* 検証用: window.__officeTimeOverride = 時(0-23) または 'morning' 等 */
  function realScene() {
    var ov = window.__officeTimeOverride;
    if (ov != null) {
      if (typeof ov === 'string' && SCENES.indexOf(ov) >= 0) return ov;
      var hn = Number(ov);
      if (!isNaN(hn)) return sceneForHour(((Math.floor(hn) % 24) + 24) % 24);
    }
    return sceneForHour(jstHourNow());
  }

  var timeBtn = document.createElement('button');
  timeBtn.type = 'button';
  timeBtn.className = 'office-time-btn';
  timeBtn.title = 'タップで次の時間帯をプレビュー(10秒で実時刻に戻ります)';
  sceneEl.appendChild(timeBtn);

  function applyScene(sc) {
    if (sc === curScene) return;
    curScene = sc;
    SCENES.forEach(function (n) { sceneEl.classList.toggle('scene--' + n, n === sc); });
    timeBtn.innerHTML = SCENE_ICON[sc] + ' <span>' + esc(SCENE_NAME[sc]) + '</span>';
    timeBtn.setAttribute('aria-label', '現在の時間帯: ' + SCENE_NAME[sc] + '。タップで次の時間帯をプレビュー');
  }
  timeBtn.addEventListener('click', function (ev) {
    ev.stopPropagation();
    applyScene(SCENES[(SCENES.indexOf(curScene) + 1) % SCENES.length]);
    timeBtn.classList.add('is-preview');
    if (scenePreviewTimer) clearTimeout(scenePreviewTimer);
    scenePreviewTimer = setTimeout(function () {
      scenePreviewTimer = null;
      timeBtn.classList.remove('is-preview');
      applyScene(realScene());
    }, 10000);
  });
  applyScene(realScene());

  /* ---------- フロア切替(1F 執務フロア / RF スカイラウンジ) ---------- */
  var floorTabsEl = document.createElement('div');
  floorTabsEl.className = 'office-floortabs';
  floorTabsEl.setAttribute('aria-label', 'フロア切替');
  floorTabsEl.innerHTML =
    '<button type="button" class="office-floortab" data-floor="rf"><b>RF</b><span>スカイラウンジ</span></button>' +
    '<button type="button" class="office-floortab is-active" data-floor="1f"><b>1F</b><span>執務フロア</span></button>';
  sceneEl.appendChild(floorTabsEl);

  /* ---------- ナビゲーション(ゾーンジャンプ+ミニマップ・フロア連動) ---------- */
  var navEl = document.createElement('div');
  navEl.className = 'office-nav';
  navEl.innerHTML =
    '<div class="office-jump" role="tablist" aria-label="ゾーンへ移動"></div>' +
    '<div class="office-map" aria-label="ミニマップ(クリックで移動)"></div>';
  sceneEl.appendChild(navEl);
  var mapEl = navEl.querySelector('.office-map');
  var jumpEl = navEl.querySelector('.office-jump');
  var mapViewEl = null;

  function zonesFor() { return curFloor === 'rf' ? RF_ZONES : ZONES; }
  function renderNav() {
    var jumpHtml = '';
    zonesFor().forEach(function (z) {
      jumpHtml += '<button type="button" class="office-jump__chip" data-zone="' + z.id + '"><span class="office-jump__dot" style="background:' + z.color + '"></span>' + esc(z.label) + '</button>';
    });
    jumpEl.innerHTML = jumpHtml;
    var mapHtml = '';
    zonesFor().forEach(function (z) {
      mapHtml += '<span class="office-map__zone" style="left:' + (z.x0 / VW * 100) + '%;width:' + ((z.x1 - z.x0) / VW * 100) + '%;background:' + z.color + '" title="' + esc(z.label) + '"></span>';
    });
    mapHtml += '<span class="office-map__view"></span>';
    mapEl.innerHTML = mapHtml;
    mapViewEl = mapEl.querySelector('.office-map__view');
  }
  renderNav();

  function setFloor(f) {
    if (curFloor === f) return;
    curFloor = f;
    floorsEl.classList.toggle('is-rf', f === 'rf');
    Array.prototype.forEach.call(floorTabsEl.querySelectorAll('.office-floortab'), function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-floor') === f);
    });
    renderNav();
    applyPan();
  }
  floorTabsEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.office-floortab');
    if (!b) return;
    ev.stopPropagation();
    setFloor(b.getAttribute('data-floor'));
  });

  /* ---------- パン/ズーム エンジン ---------- */
  var view = { pan: 0, panY: 0, zoom: 1, vel: 0, worldW: 0, worldH: 0, dragging: false, moved: false, target: null };

  function layout() {
    var vh = sceneEl.clientHeight || 1;
    var scale = (vh / VH) * view.zoom;
    view.worldW = VW * scale;
    view.worldH = VH * scale;
    worldEl.style.width = view.worldW + 'px';
    worldEl.style.height = view.worldH + 'px';
    /* 遠景: 高さは室内と同じ、幅は 4800/1100 比の等倍スケール */
    farEl.style.width = (FAR_W * scale) + 'px';
    farEl.style.height = view.worldH + 'px';
    /* 縦は下端合わせ(はみ出す分は空側を切る)。床と社員が常に見えるようにする */
    view.panY = Math.min(0, vh - view.worldH);
    clampPan();
    applyPan();
  }
  function clampPan() {
    var vw = sceneEl.clientWidth || 1;
    var min = Math.min(0, vw - view.worldW);
    if (view.pan > 0) view.pan = 0;
    if (view.pan < min) view.pan = min;
  }
  function parallaxFactor() {
    var vw = sceneEl.clientWidth || 1;
    var farW = farEl.clientWidth || 1;
    if (view.worldW <= vw) return 0;
    /* 遠景が右端で切れないよう追従率をクランプ */
    return Math.max(0, Math.min(PARALLAX, (farW - vw) / (view.worldW - vw)));
  }
  function applyPan() {
    worldEl.style.transform = 'translate3d(' + view.pan.toFixed(2) + 'px,' + view.panY.toFixed(2) + 'px,0)';
    farEl.style.transform = 'translate3d(' + (view.pan * parallaxFactor()).toFixed(2) + 'px,' + view.panY.toFixed(2) + 'px,0)';
    var vw = sceneEl.clientWidth || 1;
    var min = Math.min(0, vw - view.worldW);
    hintL.classList.toggle('is-on', view.pan < -8);
    hintR.classList.toggle('is-on', view.pan > min + 8);
    /* ミニマップの表示範囲枠 */
    if (view.worldW > 0) {
      mapViewEl.style.left = (-view.pan / view.worldW * 100) + '%';
      mapViewEl.style.width = Math.min(100, vw / view.worldW * 100) + '%';
    }
  }
  function setZoom(z) {
    z = Math.max(1, Math.min(1.5, z));
    if (z === view.zoom) return;
    var vw = sceneEl.clientWidth || 1;
    var ratio = z / view.zoom;
    view.pan = (view.pan - vw / 2) * ratio + vw / 2;
    view.zoom = z;
    view.target = null;
    layout();
  }
  zoomWrap.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.office-zoom__btn');
    if (!btn) return;
    setZoom(view.zoom + Number(btn.getAttribute('data-z')) * 0.25);
  });

  /* 論理X座標が画面中央に来るパン値 */
  function panForWorldX(wx) {
    var vw = sceneEl.clientWidth || 1;
    var p = -(wx / VW * view.worldW - vw / 2);
    var min = Math.min(0, vw - view.worldW);
    return Math.max(min, Math.min(0, p));
  }
  function smoothPanTo(wx) {
    view.vel = 0;
    view.target = panForWorldX(wx);
    dragNote.classList.add('is-hidden');
  }

  /* ゾーンジャンプ(現在フロアのゾーンから検索) */
  jumpEl.addEventListener('click', function (ev) {
    var chip = ev.target.closest('.office-jump__chip');
    if (!chip) return;
    var zs = zonesFor();
    var z = null;
    for (var i = 0; i < zs.length; i++) if (zs[i].id === chip.getAttribute('data-zone')) z = zs[i];
    if (z) smoothPanTo((z.x0 + z.x1) / 2);
  });

  /* ミニマップ: クリック/ドラッグで移動 */
  var mapDrag = false;
  function mapToPan(clientX, smooth) {
    var r = mapEl.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width)));
    var wx = ratio * VW;
    if (smooth) smoothPanTo(wx);
    else { view.target = null; view.vel = 0; view.pan = panForWorldX(wx); applyPan(); }
  }
  mapEl.addEventListener('pointerdown', function (ev) {
    mapDrag = true;
    try { mapEl.setPointerCapture(ev.pointerId); } catch (e) {}
    mapToPan(ev.clientX, true);
    ev.stopPropagation();
    ev.preventDefault();
  });
  mapEl.addEventListener('pointermove', function (ev) {
    if (!mapDrag) return;
    mapToPan(ev.clientX, false);
    ev.stopPropagation();
  });
  function endMapDrag() { mapDrag = false; }
  mapEl.addEventListener('pointerup', endMapDrag);
  mapEl.addEventListener('pointercancel', endMapDrag);

  /* ドラッグ/スワイプ(Pointer Events) */
  var drag = { id: null, lastX: 0, lastT: 0, startX: 0, startY: 0 };
  sceneEl.addEventListener('pointerdown', function (ev) {
    if (ev.target.closest('.office-panel, .office-hud, .office-zoom, .office-nav, .office-roster, .office-roster-btn, .office-floortabs, .office-time-btn')) return;
    drag.id = ev.pointerId;
    drag.lastX = ev.clientX; drag.lastT = performance.now();
    drag.startX = ev.clientX; drag.startY = ev.clientY;
    view.dragging = true; view.moved = false; view.vel = 0; view.target = null;
    sceneEl.classList.add('is-grabbing');
    try { sceneEl.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  sceneEl.addEventListener('pointermove', function (ev) {
    if (!view.dragging || ev.pointerId !== drag.id) return;
    var dx = ev.clientX - drag.lastX;
    var now = performance.now();
    var dtm = Math.max(1, now - drag.lastT);
    view.vel = view.vel * 0.6 + (dx / dtm * 1000) * 0.4;
    drag.lastX = ev.clientX; drag.lastT = now;
    if (Math.abs(ev.clientX - drag.startX) > 6 || Math.abs(ev.clientY - drag.startY) > 6) view.moved = true;
    view.pan += dx;
    clampPan();
    applyPan();
    if (view.moved) { hideTip(); dragNote.classList.add('is-hidden'); ev.preventDefault(); }
  });
  function endDrag(ev) {
    if (!view.dragging || (ev && ev.pointerId !== drag.id)) return;
    view.dragging = false;
    sceneEl.classList.remove('is-grabbing');
  }
  sceneEl.addEventListener('pointerup', endDrag);
  sceneEl.addEventListener('pointercancel', endDrag);
  /* ドラッグ後のclickは抑止(社員クリックと区別) */
  sceneEl.addEventListener('click', function (ev) {
    if (view.moved) { ev.stopPropagation(); ev.preventDefault(); view.moved = false; }
  }, true);
  /* タッチの横スワイプがページスクロールに漏れないように(縦は通す) */
  sceneEl.style.touchAction = 'pan-y';
  sceneEl.addEventListener('touchmove', function (ev) {
    if (view.dragging && view.moved) ev.preventDefault();
  }, { passive: false });

  /* キーボード ←→ */
  sceneEl.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      view.pan += ev.key === 'ArrowLeft' ? 160 : -160;
      view.vel = 0; view.target = null;
      clampPan(); applyPan();
      dragNote.classList.add('is-hidden');
      ev.preventDefault();
    } else if (ev.key === 'Escape') {
      closePanel();
      closeRoster();
    }
  });

  window.addEventListener('resize', layout);
  layout();
  /* 初期位置: エントランスがちらっと入りつつ経営ラウンジが見える位置 */
  view.pan = -(view.worldW * ((OWNER_W + 260) / VW));
  clampPan(); applyPan();

  /* ---------- 社員スプライト ---------- */
  var STATE_LABEL = {
    work: '🖥 作業中', coffee: '☕ 休憩中', meeting: '💬 会議中',
    wander: '🚶 巡回中', idle: '🌃 ひと息中',
    break: '🛋 休憩中', read: '📖 読書中', focus: '🎧 集中作業中',
    rooftop: '🍹 スカイラウンジで休憩中',
    'lift-up': '🛗 スカイラウンジへ移動中', 'lift-down': '🛗 執務フロアへ戻り中'
  };
  var STATE_BUBBLE = {
    work: '💻', coffee: '☕', meeting: '💬', wander: '', idle: '…', break: '🌿', read: '📖', focus: '🎧',
    rooftop: '🍹', 'lift-up': '🛗', 'lift-down': '🛗'
  };

  /* キャラクターSVG(assets/characters/<slug>.svg)を優先し、
     未完成/欠品なら従来のオフィスドット絵にフォールバック */
  function setCharSrc(img, e) {
    img.onerror = function () {
      img.onerror = null;
      img.classList.add('is-fallback');
      img.src = 'assets/avatars/office/' + encodeURIComponent(e.name) + '.svg';
    };
    img.src = 'assets/characters/' + e.slug + '.svg';
  }

  var emps = EMPLOYEES.map(function (e, idx) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'office-emp';
    el.setAttribute('aria-label', e.name + '(' + e.role + ')');
    /* 磨いた床への鏡面反射(本体と同じ画像を上下反転・フェード) */
    var refl = document.createElement('img');
    refl.className = 'office-emp__refl';
    refl.alt = '';
    refl.draggable = false;
    refl.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    img.addEventListener('load', function () { refl.src = img.src; });
    setCharSrc(img, e);
    var bub = document.createElement('span');
    bub.className = 'office-emp__bubble';
    /* 着席時にデスクの手前板が重なる(座ってる感) */
    var deskFront = document.createElement('span');
    deskFront.className = 'office-emp__deskfront';
    el.appendChild(refl);
    el.appendChild(img);
    el.appendChild(deskFront);
    el.appendChild(bub);
    stageEl.appendChild(el);

    var seat = DEPT_SEATS[e.dept][idx % DEPT_SEATS[e.dept].length];
    return {
      def: e, el: el, img: img, refl: refl, bub: bub,
      seat: null, x: seat[0] + rand(-30, 30), y: seat[1] + rand(-15, 15),
      tx: seat[0], ty: seat[1], state: 'wander', timer: rand(0.5, 3),
      speed: rand(95, 145), facing: 1, activity: null, active: false,
      typeTimer: 0, floor: '1f', transferring: false
    };
  });

  /* 席割り当て(部門内で順番に) */
  (function assignSeats() {
    var used = {};
    emps.forEach(function (em) {
      var seats = DEPT_SEATS[em.def.dept];
      var n = used[em.def.dept] || 0;
      em.seat = seats[n % seats.length];
      used[em.def.dept] = n + 1;
    });
  })();

  /* ---------- 行動エンジン ---------- */
  function setBubble(em) {
    em.bub.textContent = STATE_BUBBLE[em.state] || '';
    em.el.classList.toggle('is-working', em.state === 'work' || em.state === 'focus');
  }
  function goSpot(em, spot, jx, jy) {
    em.tx = spot[0] + rand(-(jx || 0), jx || 0);
    em.ty = spot[1] + rand(-(jy || 0), jy || 0);
  }

  /* RFにいる/向かっている人数(勤務優先比率の維持: 常時2〜4名程度) */
  function rfCount() {
    var n = 0;
    emps.forEach(function (e2) { if (e2.floor === 'rf' || e2.state === 'lift-up') n++; });
    return n;
  }

  /* エレベーター演出: 両フロアの扉を開閉 */
  function pingElevator() {
    ['officeElev1F', 'officeElevRF'].forEach(function (id) {
      var g = document.getElementById(id);
      if (!g) return;
      g.classList.add('is-open');
      setTimeout(function () { g.classList.remove('is-open'); }, 2200);
    });
  }

  /* フロア間移動(エレベーター搭乗 → 反対フロアで降車) */
  function transferFloor(em, to) {
    if (em.transferring) return;
    em.transferring = true;
    em.el.classList.remove('is-moving');
    em.el.classList.add('is-inlift');
    pingElevator();
    setTimeout(function () {
      em.floor = to;
      (to === 'rf' ? rfStageEl : stageEl).appendChild(em.el);
      em.x = ELEV_SPOT[0]; em.y = ELEV_SPOT[1];
      if (to === 'rf') {
        var sp = pick(RF_BREAK_SPOTS);
        em.state = 'rooftop';
        em.tx = sp[0] + rand(-14, 14); em.ty = sp[1] + rand(-8, 8);
        em.timer = rand(15, 30);
      } else {
        em.state = 'work';
        em.tx = em.seat[0]; em.ty = em.seat[1];
        em.timer = rand(12, 26);
      }
      setBubble(em);
      em.el.style.left = (em.x / VW * 100) + '%';
      em.el.style.top = (em.y / VH * 100) + '%';
      setTimeout(function () {
        em.el.classList.remove('is-inlift');
        em.transferring = false;
      }, 450);
    }, 1000);
  }

  function nextState(em) {
    /* RF滞在中: しばらく寛いだら1Fへ戻る */
    if (em.floor === 'rf') {
      if (Math.random() < 0.45 && rfCount() <= 4) {
        em.state = 'rooftop';
        goSpot(em, pick(RF_BREAK_SPOTS), 14, 8);
        em.timer = rand(12, 26);
      } else {
        em.state = 'lift-down';
        em.tx = ELEV_SPOT[0]; em.ty = ELEV_SPOT[1];
        em.timer = 999;
      }
      setBubble(em);
      return;
    }
    if (em.active) {
      /* 稼働中: 90% デスク作業、たまにコーヒー */
      if (Math.random() < 0.9) {
        em.state = 'work';
        em.tx = em.seat[0]; em.ty = em.seat[1];
        em.timer = rand(10, 24);
      } else {
        em.state = 'coffee';
        goSpot(em, pick(COFFEE_SPOTS), 20, 10);
        em.timer = rand(5, 9);
      }
    } else if (function () {
      var n = rfCount();
      var p2 = n < 2 ? 0.28 : (n < 4 ? 0.06 : 0);
      return Math.random() < p2;
    }()) {
      /* たまにエレベーターでスカイラウンジへ(RFは常時2〜4名程度) */
      em.state = 'lift-up';
      em.tx = ELEV_SPOT[0]; em.ty = ELEV_SPOT[1];
      em.timer = 999;
    } else {
      /* 基本は常に勤務(オーナー方針 2026-07-09)。休憩・移動は少数の彩りに留める */
      var roll = Math.random();
      if (roll < 0.7) {
        em.state = 'work';
        em.tx = em.seat[0]; em.ty = em.seat[1];
        em.timer = rand(12, 26);
      } else if (roll < 0.78) {
        em.state = 'meeting';
        goSpot(em, pick(MEETING_SPOTS), 15, 0);
        em.timer = rand(8, 14);
      } else if (roll < 0.85) {
        em.state = 'focus';
        goSpot(em, pick(FOCUS_SPOTS), 6, 4);
        em.timer = rand(10, 16);
      } else if (roll < 0.9) {
        em.state = 'coffee';
        goSpot(em, pick(COFFEE_SPOTS), 20, 10);
        em.timer = rand(4, 8);
      } else if (roll < 0.94) {
        /* フロア移動(ゾーン間) */
        em.state = 'wander';
        em.tx = rand(WALK_AREA.x0, WALK_AREA.x1);
        em.ty = rand(WALK_AREA.y0, WALK_AREA.y1);
        em.timer = rand(2, 5);
      } else if (roll < 0.97) {
        /* リフレッシュ: ソファ・卓球・テラス */
        em.state = 'break';
        goSpot(em, pick(BREAK_SPOTS), 12, 8);
        em.timer = rand(5, 9);
      } else {
        em.state = 'read';
        goSpot(em, pick(READ_SPOTS), 8, 6);
        em.timer = rand(6, 10);
      }
    }
    setBubble(em);
  }

  var lastT = null, rafId = null;
  function frame(t) {
    rafId = requestAnimationFrame(frame);
    if (lastT === null) { lastT = t; return; }
    var dt = Math.min(0.1, (t - lastT) / 1000);
    lastT = t;

    /* ゾーンジャンプのスムーズ移動 */
    if (view.target !== null && !view.dragging) {
      var diff = view.target - view.pan;
      if (Math.abs(diff) < 1) {
        view.pan = view.target;
        view.target = null;
      } else {
        view.pan += diff * Math.min(1, dt * 5.5);
      }
      clampPan();
      applyPan();
    } else if (!view.dragging && Math.abs(view.vel) > 4) {
      /* 慣性スクロール */
      view.pan += view.vel * dt;
      view.vel *= Math.pow(0.06, dt); /* 減衰 */
      clampPan();
      applyPan();
    }

    emps.forEach(function (em) {
      if (em.transferring) return; /* エレベーター搭乗中 */
      var dx = em.tx - em.x, dy = em.ty - em.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var moving = false;
      if (dist > 4) {
        var step = em.speed * dt;
        em.x += dx / dist * Math.min(step, dist);
        em.y += dy / dist * Math.min(step, dist);
        if (Math.abs(dx) > 4) em.facing = dx < 0 ? -1 : 1;
        em.el.classList.add('is-moving');
        moving = true;
      } else {
        em.el.classList.remove('is-moving');
        /* エレベーター前に到着 → 反対フロアへ */
        if (em.state === 'lift-up') { transferFloor(em, 'rf'); return; }
        if (em.state === 'lift-down') { transferFloor(em, '1f'); return; }
        em.timer -= dt;
        if (em.timer <= 0) nextState(em);
      }
      /* 着席表現(デスク作業中は少し沈み+デスク手前板が重なる) */
      em.el.classList.toggle('is-sitting', !moving && (em.state === 'work' || em.state === 'focus'));
      /* タイピング演出(作業中は 💻 と ... を切替) */
      if (em.state === 'work') {
        em.typeTimer -= dt;
        if (em.typeTimer <= 0) {
          em.typeTimer = rand(1.2, 3);
          em.bub.textContent = em.bub.textContent === '💻' ? '…' : '💻';
        }
      }
      em.el.style.left = (em.x / VW * 100) + '%';
      em.el.style.top = (em.y / VH * 100) + '%';
      em.el.style.zIndex = 10 + Math.round(em.y / 4);
      var flip = em.facing < 0 ? 'scaleX(-1)' : '';
      em.img.style.transform = flip;
      em.refl.style.transform = 'scaleY(-1)' + (flip ? ' ' + flip : '');
    });

    updateOwner(dt);
  }
  function startLoop() { if (rafId === null) { lastT = null; rafId = requestAnimationFrame(frame); } }
  function stopLoop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }
  document.addEventListener('visibilitychange', function () {
    /* 復帰時は必ず新しいrAFハンドルで再開する
       (バックグラウンド中に保留rAFが破棄される環境への保険) */
    stopLoop();
    if (!document.hidden) startLoop();
  });

  /* ---------- ツールチップ / 詳細パネル ---------- */
  function activityLine(em) {
    var a = em.activity;
    if (!a) return '勤務中';
    var parts = [];
    if (a.last_at) { var r = relTime(a.last_at); if (r) parts.push(r + 'に稼働'); }
    if (typeof a.sessions_7d === 'number') parts.push('直近7日で' + a.sessions_7d + 'セッション');
    return parts.length ? parts.join(' / ') : '勤務中';
  }

  function showTip(em) {
    if (view.dragging) return;
    var e = em.def;
    tipEl.innerHTML =
      '<strong>' + esc(e.name) + '</strong><small>(' + esc(e.role) + ')</small><br>' +
      '<span class="office-tip__dept" style="color:' + DEPT_COLOR[e.dept] + '">●</span> ' + esc(e.dept) + '<br>' +
      esc(STATE_LABEL[em.state] || '勤務中') + ' — ' + esc(activityLine(em));
    tipEl.classList.add('is-on');
    var w = sceneEl.clientWidth;
    /* シーン座標 → 画面座標(パン/ズーム考慮) */
    var x = view.pan + em.x / VW * view.worldW;
    var y = view.panY + em.y / VH * view.worldH;
    tipEl.style.left = Math.max(6, Math.min(w - tipEl.offsetWidth - 6, x - tipEl.offsetWidth / 2)) + 'px';
    var top = y - (em.el.offsetHeight + tipEl.offsetHeight + 14);
    tipEl.style.top = Math.max(6, top) + 'px';
  }
  function hideTip() { tipEl.classList.remove('is-on'); }

  /* 最近の仕事(activity[slug].works = [{at,msg}] 最大3件 = 本物のgitコミット)。
     works が無い社員は従来どおり recent(セッション時刻)を表示 */
  function historyHtml(em) {
    var a = em.activity || {};
    if (a.works && a.works.length) {
      var wrows = [];
      a.works.slice(0, 3).forEach(function (w) {
        if (!w || !w.msg) return;
        wrows.push('<li><span class="office-panel__hist-at">' + esc(w.at || '') + '</span> ' + esc(w.msg) + '</li>');
      });
      if (wrows.length) {
        return '<div class="office-panel__hist"><p class="office-panel__hist-title">最近の仕事 <small>(実際の作業記録より)</small></p>' +
          '<ul class="office-panel__hist-list office-panel__hist-list--works">' + wrows.join('') + '</ul></div>';
      }
    }
    var html = '<div class="office-panel__hist"><p class="office-panel__hist-title">直近の仕事履歴</p>';
    var rec = (a.recent && a.recent.length) ? a.recent.slice(-3).reverse() : [];
    var rows = [];
    rec.forEach(function (iso) {
      var st = jstStamp(iso);
      if (st) rows.push('<li>' + esc(st) + ' セッション実施</li>');
    });
    html += rows.length
      ? '<ul class="office-panel__hist-list">' + rows.join('') + '</ul>'
      : '<p class="office-panel__hist-empty">初出勤待ち</p>';
    return html + '</div>';
  }

  function openPanel(em) {
    closeRoster();
    var e = em.def;
    panelEl.innerHTML =
      '<button type="button" class="office-panel__close" aria-label="閉じる">×</button>' +
      '<img class="office-panel__avatar" alt="' + esc(e.name) + 'のアバター">' +
      '<p class="office-panel__name dot">' + esc(e.name) + '</p>' +
      '<p class="office-panel__role">' + esc(e.role) + ' <span class="office-panel__dept" style="border-color:' + DEPT_COLOR[e.dept] + ';color:' + DEPT_COLOR[e.dept] + '">' + esc(e.dept) + '</span></p>' +
      '<p class="office-panel__blurb">' + esc(e.blurb) + '</p>' +
      '<p class="office-panel__act">' + esc(STATE_LABEL[em.state] || '勤務中') + ' — ' + esc(activityLine(em)) + '</p>' +
      historyHtml(em) +
      '<p><a href="https://github.com/shotaro-nagano/ai-company/blob/main/agents/' + e.slug + '.md" rel="noopener">仕様書を見る(GitHub)→</a></p>';
    var av = panelEl.querySelector('.office-panel__avatar');
    av.onerror = function () {
      av.onerror = null;
      av.classList.add('is-fallback');
      av.src = 'assets/avatars/' + encodeURIComponent(e.name) + '.svg';
    };
    av.src = 'assets/characters/' + e.slug + '.svg';
    panelEl.classList.add('is-open');
    panelEl.querySelector('.office-panel__close').addEventListener('click', closePanel);
  }
  function closePanel() { panelEl.classList.remove('is-open'); }

  emps.forEach(function (em) {
    em.el.addEventListener('mouseenter', function () { showTip(em); });
    em.el.addEventListener('mouseleave', hideTip);
    em.el.addEventListener('focus', function () { showTip(em); });
    em.el.addEventListener('blur', hideTip);
    em.el.addEventListener('click', function (ev) {
      if (view.moved) return;
      ev.stopPropagation();
      openPanel(em);
    });
  });
  sceneEl.addEventListener('click', function (ev) {
    if (!panelEl.contains(ev.target)) closePanel();
  });

  /* ---------- オーナー(人間・社長室常駐/EMPLOYEESとは独立) ----------
     2026-07-10 オーナー本人の希望によりキャラクター表示は停止(部屋は残す)。
     「人間の経常労働ゼロ」の体現として、社長室は主なき空席のまま稼働する。 */
  var OWNER_VISIBLE = false;
  var OWNER_STATE_LABEL = {
    desk: '🗂 デスクで書類を眺めている',
    sofa: '📱 ソファでスマホを見ている',
    scope: '🔭 望遠鏡でみなとみらいを眺めている',
    patrol: '🚶 たまの見回り(フロアを一周)'
  };
  var OWNER_BUBBLE = { desk: '☕', sofa: '📱', scope: '🔭', patrol: '👀' };

  var ownerEl = document.createElement('button');
  ownerEl.type = 'button';
  ownerEl.className = 'office-emp office-emp--owner';
  ownerEl.setAttribute('aria-label', 'オーナー(人間・最終承認者)');
  var ownerImg = document.createElement('img');
  ownerImg.alt = '';
  ownerImg.draggable = false;
  ownerImg.onerror = function () { ownerImg.onerror = null; ownerEl.style.display = 'none'; };
  ownerImg.src = 'assets/characters/owner.svg';
  var ownerBub = document.createElement('span');
  ownerBub.className = 'office-emp__bubble';
  ownerEl.appendChild(ownerImg);
  ownerEl.appendChild(ownerBub);
  if (OWNER_VISIBLE) {
    stageEl.appendChild(ownerEl);
  } else {
    ownerEl.style.display = 'none';
  }

  var owner = {
    x: OWNER_SPOTS.desk[0], y: OWNER_SPOTS.desk[1],
    tx: OWNER_SPOTS.desk[0], ty: OWNER_SPOTS.desk[1],
    state: 'desk', timer: rand(14, 24), speed: 70, facing: 1,
    route: null, routeIdx: 0,
    patrolIn: rand(480, 720) /* 約10分に1回、フロアを一周 */
  };
  ownerBub.textContent = OWNER_BUBBLE.desk;

  function ownerNextState() {
    if (owner.patrolIn <= 0) {
      owner.patrolIn = rand(480, 720);
      owner.state = 'patrol';
      owner.route = [
        [OWNER_W + 200, 990], [OWNER_W + 1400, 1000], [OWNER_W + 2800, 1010],
        [OWNER_W + 4300, 1000], [OWNER_W + 5900, 990], [OWNER_W + 4300, 1015],
        [OWNER_W + 2000, 995], [OWNER_W + 200, 985],
        [OWNER_SPOTS.desk[0], OWNER_SPOTS.desk[1]]
      ];
      owner.routeIdx = 0;
      owner.tx = owner.route[0][0]; owner.ty = owner.route[0][1];
    } else {
      var states = ['desk', 'sofa', 'scope'].filter(function (st) { return st !== owner.state; });
      owner.state = pick(states);
      var sp = OWNER_SPOTS[owner.state];
      owner.tx = sp[0]; owner.ty = sp[1];
      owner.timer = rand(18, 34); /* ゆったり切替 */
      owner.route = null;
    }
    ownerBub.textContent = OWNER_BUBBLE[owner.state] || '';
  }

  function updateOwner(dt) {
    if (!OWNER_VISIBLE) return;
    owner.patrolIn -= dt;
    var dx = owner.tx - owner.x, dy = owner.ty - owner.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 4) {
      var step = owner.speed * dt;
      owner.x += dx / dist * Math.min(step, dist);
      owner.y += dy / dist * Math.min(step, dist);
      if (Math.abs(dx) > 4) owner.facing = dx < 0 ? -1 : 1;
      ownerEl.classList.add('is-moving');
    } else if (owner.route) {
      owner.routeIdx++;
      if (owner.routeIdx < owner.route.length) {
        owner.tx = owner.route[owner.routeIdx][0];
        owner.ty = owner.route[owner.routeIdx][1];
      } else {
        owner.route = null;
        owner.state = 'desk';
        owner.timer = rand(18, 34);
        ownerBub.textContent = OWNER_BUBBLE.desk;
      }
    } else {
      ownerEl.classList.remove('is-moving');
      owner.timer -= dt;
      if (owner.timer <= 0) ownerNextState();
    }
    ownerEl.style.left = (owner.x / VW * 100) + '%';
    ownerEl.style.top = (owner.y / VH * 100) + '%';
    ownerEl.style.zIndex = 10 + Math.round(owner.y / 4);
    ownerImg.style.transform = owner.facing < 0 ? 'scaleX(-1)' : '';
  }

  function showOwnerTip() {
    if (view.dragging) return;
    tipEl.innerHTML =
      '<strong>オーナー(人間)</strong><small> / 最終承認者</small><br>' +
      '<span class="office-tip__dept" style="color:#F4EFDE">●</span> 社長室<br>' +
      esc(OWNER_STATE_LABEL[owner.state] || '👀 見守り中') + ' — 経常労働ゼロで見守り中';
    tipEl.classList.add('is-on');
    var w = sceneEl.clientWidth;
    var x = view.pan + owner.x / VW * view.worldW;
    var y = view.panY + owner.y / VH * view.worldH;
    tipEl.style.left = Math.max(6, Math.min(w - tipEl.offsetWidth - 6, x - tipEl.offsetWidth / 2)) + 'px';
    tipEl.style.top = Math.max(6, y - (ownerEl.offsetHeight + tipEl.offsetHeight + 14)) + 'px';
  }

  function openOwnerPanel() {
    closeRoster();
    panelEl.innerHTML =
      '<button type="button" class="office-panel__close" aria-label="閉じる">×</button>' +
      '<img class="office-panel__avatar" src="assets/characters/owner.svg" alt="オーナーのアバター">' +
      '<p class="office-panel__name dot">オーナー</p>' +
      '<p class="office-panel__role">人間・法的責任と最終承認者 <span class="office-panel__dept" style="border-color:#F4EFDE;color:#F4EFDE">社長室</span></p>' +
      '<p class="office-panel__blurb">この会社で唯一の人間。仕事は✅を押すことと、確定申告。</p>' +
      '<p class="office-panel__act">👀 見守り中(経常労働 0分/月 目標) — ' + esc(OWNER_STATE_LABEL[owner.state] || '') + '</p>' +
      '<p><a href="https://github.com/shotaro-nagano/ai-company/blob/main/README.md" rel="noopener">会社のREADMEを見る(GitHub)→</a></p>';
    panelEl.classList.add('is-open');
    panelEl.querySelector('.office-panel__close').addEventListener('click', closePanel);
  }

  ownerEl.addEventListener('mouseenter', showOwnerTip);
  ownerEl.addEventListener('mouseleave', hideTip);
  ownerEl.addEventListener('focus', showOwnerTip);
  ownerEl.addEventListener('blur', hideTip);
  ownerEl.addEventListener('click', function (ev) {
    if (view.moved) return;
    ev.stopPropagation();
    openOwnerPanel();
  });

  /* ---------- 社員一覧ドロワー(👥 社員名簿) ---------- */
  var rosterBtn = document.createElement('button');
  rosterBtn.type = 'button';
  rosterBtn.className = 'office-roster-btn';
  rosterBtn.setAttribute('aria-expanded', 'false');
  rosterBtn.innerHTML = '👥 <span>社員名簿</span>';
  sceneEl.appendChild(rosterBtn);

  var rosterEl = document.createElement('aside');
  rosterEl.className = 'office-roster';
  rosterEl.setAttribute('aria-label', '社員名簿');
  sceneEl.appendChild(rosterEl);

  function stateIcon(em) {
    var label = STATE_LABEL[em.state] || '🖥 作業中';
    return label.split(' ')[0];
  }
  function renderRoster() {
    var html =
      '<div class="office-roster__head"><strong>👥 社員名簿</strong>' +
      '<span>' + (emps.length + (OWNER_VISIBLE ? 1 : 0)) + '名</span>' +
      '<button type="button" class="office-roster__close" aria-label="閉じる">×</button></div>';
    /* オーナー(人間)— 本人の希望で非表示(経常労働ゼロの体現) */
    if (OWNER_VISIBLE) {
      html += '<button type="button" class="office-roster__row" data-who="owner">' +
        '<img src="assets/characters/owner.svg" alt="" draggable="false">' +
        '<span class="office-roster__info"><span class="office-roster__name">オーナー</span>' +
        '<span class="office-roster__role" style="color:#F4EFDE">人間・最終承認者</span></span>' +
        '<span class="office-roster__state">' + esc(OWNER_BUBBLE[owner.state] || '👀') + '</span></button>';
    }
    /* AI社員22名 */
    emps.forEach(function (em, i) {
      var e = em.def;
      html += '<button type="button" class="office-roster__row" data-who="' + i + '">' +
        '<img data-slug="' + esc(e.slug) + '" alt="" draggable="false">' +
        '<span class="office-roster__info"><span class="office-roster__name">' + esc(e.name) +
        (em.active ? ' <i class="office-roster__on" title="直近24時間に稼働"></i>' : '') + '</span>' +
        '<span class="office-roster__role" style="color:' + DEPT_COLOR[e.dept] + '">' + esc(e.role) + '</span></span>' +
        '<span class="office-roster__state" title="' + esc(STATE_LABEL[em.state] || '勤務中') + '">' + esc(stateIcon(em)) + '</span></button>';
    });
    rosterEl.innerHTML = html;
    /* 顔画像(characters優先・ドット絵フォールバック) */
    Array.prototype.forEach.call(rosterEl.querySelectorAll('img[data-slug]'), function (img) {
      var slug = img.getAttribute('data-slug');
      for (var i = 0; i < EMPLOYEES.length; i++) {
        if (EMPLOYEES[i].slug === slug) { setCharSrc(img, EMPLOYEES[i]); break; }
      }
    });
  }
  function openRoster() {
    closePanel();
    renderRoster();
    rosterEl.classList.add('is-open');
    rosterBtn.setAttribute('aria-expanded', 'true');
  }
  function closeRoster() {
    rosterEl.classList.remove('is-open');
    rosterBtn.setAttribute('aria-expanded', 'false');
  }
  rosterBtn.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (rosterEl.classList.contains('is-open')) closeRoster(); else openRoster();
  });
  rosterEl.addEventListener('click', function (ev) {
    ev.stopPropagation();
    if (ev.target.closest('.office-roster__close')) { closeRoster(); return; }
    var row = ev.target.closest('.office-roster__row');
    if (!row) return;
    var who = row.getAttribute('data-who');
    closeRoster();
    if (who === 'owner') {
      setFloor('1f');
      smoothPanTo(owner.x);
      openOwnerPanel();
    } else {
      var em = emps[Number(who)];
      if (em) {
        setFloor(em.floor === 'rf' ? 'rf' : '1f');
        smoothPanTo(em.x);
        openPanel(em);
      }
    }
  });
  /* シーンの余白クリックで閉じる(社員クリック等は stopPropagation 済み) */
  sceneEl.addEventListener('click', function (ev) {
    if (!rosterEl.contains(ev.target) && !rosterBtn.contains(ev.target)) closeRoster();
  });

  /* ---------- HUD ---------- */
  function updateClock() {
    var el = hudEl.querySelector('.office-hud__time');
    if (el) el.textContent = jstNow();
  }
  function renderHUD(d) {
    var hp = Math.max(0, Math.min(100, d.hp_percent || 0));
    var exp = Math.max(0, Math.min(100, d.exp_percent || 0));
    hudEl.innerHTML =
      '<div class="office-hud__lv dot">Lv.' + (d.level || 1) + ' PixelYen</div>' +
      '<div class="office-hud__clock">🕐 <span class="office-hud__time dot">--:--</span> <small>JST</small></div>' +
      '<div class="office-hud__status">🟢 自律運転中 <span class="dot">24/7</span></div>' +
      '<div class="office-hud__bar"><span class="dot">HP</span><span class="office-hud__track"><span class="office-hud__fill office-hud__fill--hp" style="width:' + hp + '%"></span></span></div>' +
      '<div class="office-hud__bar"><span class="dot">EXP</span><span class="office-hud__track"><span class="office-hud__fill office-hud__fill--exp" style="width:' + exp + '%"></span></span></div>' +
      '<div class="office-hud__money">今月売上 <span class="office-hud__num">' + yen(d.revenue_this_month) + '</span></div>' +
      '<div class="office-hud__money">純利益 <span class="office-hud__num">' + yen(d.profit_this_month) + '</span></div>' +
      '<a class="office-hud__link dot" href="dashboard.html">詳細ステータス→</a>';
    updateClock();
  }

  /* ---------- オフィスタブ ---------- */
  function renderTabs(reg) {
    var html = '';
    (reg.offices || []).forEach(function (o) {
      html += '<span class="office-tab' + (o.id === 'hq' ? ' is-active' : '') + ' dot">🏙 ' + esc(o.name) + ' <small>みなとみらい</small></span>';
    });
    if (reg.next_unlock) {
      html += '<span class="office-tab office-tab--locked dot">🔒 Lv' + esc(String(reg.next_unlock.level)) + 'で解放(' + esc(reg.next_unlock.condition) + ')</span>';
    }
    tabsEl.innerHTML = html;
  }

  /* ---------- データ取得(失敗時フォールバック) ---------- */
  function fetchJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  /* ---------- 実データの館内投影(会議室スクリーン+KPIモニター壁) ---------- */
  function updateDataScreens(d) {
    try {
      var board = document.getElementById('officeBoardData');
      if (board) {
        var exp = Math.max(0, Math.min(100, d.exp_percent || 0));
        var hp = Math.max(0, Math.min(100, d.hp_percent || 0));
        board.innerHTML =
          '<rect x="1740" y="672" width="140" height="194" rx="3" fill="#0b1626" opacity="0.94"/>' +
          '<text x="1810" y="700" text-anchor="middle" font-size="14" fill="#8ccfff" font-family="sans-serif" letter-spacing="1.5">PIXELYEN Lv.' + (d.level || 1) + '</text>' +
          '<text x="1752" y="728" font-size="10" fill="#9db6e8" font-family="sans-serif">EXP</text>' +
          '<rect x="1752" y="734" width="116" height="10" rx="5" fill="#16324a"/>' +
          '<rect x="1752" y="734" width="' + Math.max(2, 116 * exp / 100).toFixed(1) + '" height="10" rx="5" fill="#41A6F6"/>' +
          '<text x="1752" y="762" font-size="10" fill="#9db6e8" font-family="sans-serif">HP</text>' +
          '<rect x="1752" y="768" width="116" height="10" rx="5" fill="#16324a"/>' +
          '<rect x="1752" y="768" width="' + Math.max(2, 116 * hp / 100).toFixed(1) + '" height="10" rx="5" fill="#38B764"/>' +
          '<text x="1752" y="804" font-size="11" fill="#9db6e8" font-family="sans-serif">売上 <tspan fill="#FFC825">' + esc(yen(d.revenue_this_month)) + '</tspan></text>' +
          '<text x="1752" y="824" font-size="11" fill="#9db6e8" font-family="sans-serif">純利益 <tspan fill="#FFC825">' + esc(yen(d.profit_this_month)) + '</tspan></text>' +
          '<circle class="office-beacon" cx="1758" cy="848" r="4" fill="#38B764"/>' +
          '<text x="1768" y="852" font-size="9" fill="#6f88b0" font-family="sans-serif">LIVE</text>';
      }
      var kpi = document.getElementById('officeKpiData');
      if (kpi) {
        kpi.innerHTML =
          '<rect x="3192" y="668" width="156" height="58" rx="4" fill="#0b1626" opacity="0.94"/>' +
          '<text x="3270" y="688" text-anchor="middle" font-size="11" fill="#9db6e8" font-family="sans-serif">今月売上</text>' +
          '<text x="3270" y="714" text-anchor="middle" font-size="19" font-weight="bold" fill="#FFC825" font-family="sans-serif">' + esc(yen(d.revenue_this_month)) + '</text>' +
          '<rect x="3192" y="736" width="156" height="58" rx="4" fill="#0b1626" opacity="0.94"/>' +
          '<text x="3270" y="756" text-anchor="middle" font-size="11" fill="#9db6e8" font-family="sans-serif">純利益</text>' +
          '<text x="3270" y="782" text-anchor="middle" font-size="19" font-weight="bold" fill="#FFC825" font-family="sans-serif">' + esc(yen(d.profit_this_month)) + '</text>';
      }
    } catch (e) { /* 演出。失敗しても本体機能へ影響させない */ }
  }

  /* 起動時にRFへ2〜3名を先着させる(スカイラウンジに常に人けを) */
  function seedRooftop() {
    var cands = emps.filter(function (e2) { return !e2.active && e2.floor !== 'rf'; });
    for (var i2 = cands.length - 1; i2 > 0; i2--) {
      var j2 = Math.floor(Math.random() * (i2 + 1));
      var t2 = cands[i2]; cands[i2] = cands[j2]; cands[j2] = t2;
    }
    cands.slice(0, Math.min(2 + Math.floor(Math.random() * 2), cands.length)).forEach(function (em) {
      em.floor = 'rf';
      rfStageEl.appendChild(em.el);
      var sp = pick(RF_BREAK_SPOTS);
      em.x = sp[0] + rand(-14, 14); em.y = sp[1] + rand(-8, 8);
      em.tx = em.x; em.ty = em.y;
      em.state = 'rooftop';
      em.timer = rand(10, 25);
      setBubble(em);
    });
  }

  var DEFAULT_DASH = { level: 1, hp_percent: 0, exp_percent: 0, revenue_this_month: null, profit_this_month: null, activity: {} };
  var DEFAULT_OFFICES = {
    offices: [{ id: 'hq', name: '本店(最上階ペントハウス)', location: '神奈川県横浜市・みなとみらい タワーマンション最上階', unlocked_at_level: 1, scene: 'minatomirai-penthouse' }],
    next_unlock: { level: 2, condition: '月商1万円', teaser: '新オフィス' }
  };

  /* 時計は取得結果を待たずに動かす(データ欠落時も常時動作)。
     1分ごとに時間帯も再判定(プレビュー中はスキップ) */
  renderHUD(DEFAULT_DASH);
  setInterval(function () {
    updateClock();
    renderFresh();
    if (!scenePreviewTimer) applyScene(realScene());
  }, 60000);

  Promise.all([
    fetchJSON('data/dashboard.json').catch(function () { return DEFAULT_DASH; }),
    fetchJSON('offices.json').catch(function () { return DEFAULT_OFFICES; })
  ]).then(function (res) {
    var dash = res[0] || DEFAULT_DASH;
    renderHUD(dash);
    renderTabs(res[1] || DEFAULT_OFFICES);
    freshAt = dash.generated_at || null;
    renderFresh();
    updateDataScreens(dash);
    var act = dash.activity || {};
    emps.forEach(function (em) {
      em.activity = act[em.def.slug] || null;
      em.active = !!(em.activity && em.activity.active_24h);
      nextState(em);
    });
    seedRooftop();
    startLoop();
  }).catch(function () {
    renderHUD(DEFAULT_DASH);
    renderTabs(DEFAULT_OFFICES);
    updateDataScreens(DEFAULT_DASH);
    freshAt = null;
    renderFresh();
    emps.forEach(function (em) { nextState(em); });
    seedRooftop();
    startLoop();
  });
})();
