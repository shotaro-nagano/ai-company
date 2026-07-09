/* ============================================================
   PixelYen ライブオフィス — みなとみらい・タワーマンション屋上(本店)
   素のJSのみ。dashboard.json / offices.json 取得失敗時は
   全員「勤務中」のデフォルト演出にフォールバックする。
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('live-office');
  if (!root) return;

  /* ---------- 定数(シーン論理座標: 320 x 180) ---------- */
  var VW = 320, VH = 180;

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

  var DEPT_COLOR = { '経営': '#FFC825', 'プロダクト': '#41A6F6', 'グロース': '#E64539', 'コーポレート': '#38B764', '監査': '#7B5FB5' };

  /* デスク席(足元座標)。各部門島の周り */
  var DEPT_SEATS = {
    '経営':        [[34, 127], [46, 127], [58, 127], [38, 148], [54, 148]],
    'プロダクト':  [[90, 127], [102, 127], [114, 127], [94, 148], [110, 148]],
    'グロース':    [[146, 127], [158, 127], [170, 127], [146, 148], [158, 148], [170, 148]],
    'コーポレート': [[202, 127], [214, 127], [226, 127], [206, 148], [222, 148]],
    '監査':        [[269, 125]]
  };
  var COFFEE_SPOTS = [[290, 168], [300, 170], [282, 172]];
  var MEETING_SPOTS = [[128, 150], [141, 150], [154, 150], [166, 150], [134, 172], [158, 172]];
  var WALK_AREA = { x0: 14, x1: 306, y0: 122, y1: 174 };

  /* ---------- 背景SVG(みなとみらい・ドット絵) ---------- */
  function buildBackgroundSVG() {
    var s = [];
    s.push('<svg class="office-bg" viewBox="0 0 320 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">');
    /* 空 */
    s.push('<rect x="0" y="0" width="320" height="104" fill="#D9EDFD"/>');
    /* 雲 */
    s.push('<g fill="#F4EFDE"><rect x="20" y="16" width="26" height="4"/><rect x="26" y="12" width="14" height="4"/>' +
      '<rect x="150" y="26" width="30" height="4"/><rect x="158" y="22" width="16" height="4"/>' +
      '<rect x="94" y="10" width="18" height="4"/><rect x="292" y="20" width="20" height="4"/></g>');

    /* 遠景の低層ビル群 */
    s.push('<g fill="#3D4260"><rect x="0" y="86" width="18" height="18"/><rect x="96" y="82" width="14" height="22"/>' +
      '<rect x="112" y="90" width="12" height="14"/><rect x="216" y="84" width="12" height="20"/><rect x="300" y="80" width="20" height="24"/></g>');

    /* クイーンズスクエア風・階段状3連ビル */
    s.push('<g fill="#1A1C2C">' +
      '<rect x="128" y="40" width="26" height="64"/><rect x="132" y="34" width="18" height="6"/>' +
      '<rect x="158" y="54" width="24" height="50"/><rect x="161" y="48" width="17" height="6"/>' +
      '<rect x="186" y="66" width="22" height="38"/><rect x="189" y="60" width="15" height="6"/></g>');
    /* ランドマークタワー風・台形シルエット */
    s.push('<g fill="#1A1C2C">' +
      '<rect x="232" y="88" width="46" height="16"/><rect x="236" y="70" width="38" height="18"/>' +
      '<rect x="240" y="52" width="30" height="18"/><rect x="244" y="34" width="22" height="18"/>' +
      '<rect x="248" y="24" width="14" height="10"/><rect x="252" y="14" width="6" height="10"/><rect x="254" y="7" width="2" height="7"/></g>');
    /* 窓の点灯(金貨・ランダム明滅) */
    var wins = [
      [136, 46], [146, 52], [134, 68], [148, 82], [140, 92], [163, 60], [174, 70], [166, 86], [176, 94],
      [191, 72], [199, 82], [193, 94], [246, 92], [258, 94], [268, 90], [242, 76], [254, 74], [264, 78],
      [246, 58], [258, 60], [250, 40], [256, 46], [100, 88], [304, 86], [310, 94]
    ];
    for (var i = 0; i < wins.length; i++) {
      s.push('<rect class="office-win office-win--' + (i % 4) + '" x="' + wins[i][0] + '" y="' + wins[i][1] + '" width="2" height="2" fill="#FFC825"/>');
    }

    /* 観覧車(コスモクロック風・ゆっくり回転) */
    s.push('<g><rect x="46" y="86" width="4" height="18" fill="#1A1C2C"/><rect x="70" y="86" width="4" height="18" fill="#1A1C2C"/>' +
      '<rect x="52" y="94" width="16" height="3" fill="#1A1C2C"/>');
    s.push('<g class="office-wheel">');
    s.push('<circle cx="60" cy="62" r="26" fill="none" stroke="#3D4260" stroke-width="2"/>');
    s.push('<rect x="34" y="61" width="52" height="2" fill="#3D4260"/><rect x="59" y="36" width="2" height="52" fill="#3D4260"/>' +
      '<rect x="42" y="43" width="36" height="2" transform="rotate(45 60 62)" fill="#3D4260"/>' +
      '<rect x="42" y="43" width="36" height="2" transform="rotate(-45 60 62)" fill="#3D4260"/>');
    var cab = [[58, 33], [76, 41], [84, 60], [76, 78], [58, 85], [40, 78], [32, 60], [40, 41]];
    for (var c = 0; c < cab.length; c++) {
      s.push('<rect x="' + cab[c][0] + '" y="' + cab[c][1] + '" width="5" height="5" fill="' + (c % 2 ? '#FFC825' : '#E64539') + '"/>');
    }
    s.push('<rect x="57" y="59" width="6" height="6" fill="#E64539"/>');
    s.push('</g></g>');

    /* 海(空色系の帯+波のきらめき) */
    s.push('<rect x="0" y="104" width="320" height="10" fill="#41A6F6"/>');
    var gl = [[14, 107], [58, 110], [104, 106], [150, 109], [198, 107], [246, 110], [288, 106]];
    for (var g2 = 0; g2 < gl.length; g2++) {
      s.push('<rect class="office-glint office-glint--' + (g2 % 3) + '" x="' + gl[g2][0] + '" y="' + gl[g2][1] + '" width="5" height="1" fill="#D9EDFD"/>');
    }

    /* 屋上デッキ */
    s.push('<rect x="0" y="114" width="320" height="66" fill="#EBD9A6"/>');
    for (var p = 0; p < 320; p += 32) { s.push('<rect x="' + p + '" y="114" width="1" height="66" fill="#DCC98D"/>'); }
    s.push('<rect x="0" y="130" width="320" height="1" fill="#DCC98D"/><rect x="0" y="156" width="320" height="1" fill="#DCC98D"/>');
    /* 手すり */
    s.push('<rect x="0" y="112" width="320" height="2" fill="#1A1C2C"/>');
    for (var r2 = 4; r2 < 320; r2 += 16) { s.push('<rect x="' + r2 + '" y="108" width="2" height="6" fill="#1A1C2C"/>'); }
    s.push('<rect x="0" y="108" width="320" height="1" fill="#1A1C2C"/>');

    /* 床の¥コインペイント */
    s.push('<g><rect x="66" y="156" width="28" height="18" fill="#FFC825"/><rect x="70" y="152" width="20" height="26" fill="#FFC825"/>' +
      '<rect x="70" y="152" width="20" height="2" fill="#FFE08A"/><rect x="66" y="156" width="2" height="18" fill="#FFE08A"/>' +
      '<rect x="88" y="158" width="4" height="16" fill="#D9A420"/><rect x="72" y="176" width="18" height="2" fill="#D9A420"/>' +
      '<g fill="#1A1C2C"><rect x="74" y="157" width="2" height="6" fill="#1A1C2C"/><rect x="84" y="157" width="2" height="6"/>' +
      '<rect x="76" y="161" width="3" height="3"/><rect x="81" y="161" width="3" height="3"/>' +
      '<rect x="79" y="163" width="2" height="10"/><rect x="75" y="166" width="10" height="2"/><rect x="75" y="170" width="10" height="2"/></g></g>');

    /* 給水塔(左) */
    s.push('<g><rect x="8" y="96" width="22" height="16" fill="#3D4260"/><rect x="8" y="96" width="22" height="2" fill="#565E8C"/>' +
      '<rect x="6" y="94" width="26" height="3" fill="#1A1C2C"/><rect x="16" y="88" width="4" height="6" fill="#1A1C2C"/>' +
      '<rect x="10" y="112" width="3" height="10" fill="#1A1C2C"/><rect x="25" y="112" width="3" height="10" fill="#1A1C2C"/></g>');

    /* 植木 */
    var plants = [[2, 160], [306, 118], [246, 164], [110, 166]];
    for (var pl = 0; pl < plants.length; pl++) {
      var px = plants[pl][0], py = plants[pl][1];
      s.push('<g><rect x="' + px + '" y="' + (py + 6) + '" width="12" height="6" fill="#1A1C2C"/>' +
        '<rect x="' + (px + 1) + '" y="' + (py + 7) + '" width="10" height="4" fill="#EBD9A6"/>' +
        '<rect x="' + (px + 2) + '" y="' + py + '" width="8" height="6" fill="#38B764"/>' +
        '<rect x="' + (px + 4) + '" y="' + (py - 3) + '" width="4" height="3" fill="#2E9752"/></g>');
    }

    /* 部門デスク島(天板=部門カラー) */
    function desk(x, y, w, color) {
      var d = '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="10" fill="#1A1C2C"/>' +
        '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (w - 2) + '" height="8" fill="' + color + '"/>' +
        '<rect x="' + (x + 2) + '" y="' + (y + 10) + '" width="2" height="4" fill="#1A1C2C"/>' +
        '<rect x="' + (x + w - 4) + '" y="' + (y + 10) + '" width="2" height="4" fill="#1A1C2C"/>';
      for (var m = x + 5; m < x + w - 6; m += 12) {
        d += '<rect x="' + m + '" y="' + (y - 4) + '" width="6" height="4" fill="#1A1C2C"/><rect x="' + (m + 1) + '" y="' + (y - 3) + '" width="4" height="2" fill="#D9EDFD"/><rect x="' + (m + 2) + '" y="' + y + '" width="2" height="1" fill="#1A1C2C"/>';
      }
      return d + '</g>';
    }
    s.push(desk(28, 128, 36, '#FFC825'));
    s.push(desk(84, 128, 36, '#41A6F6'));
    s.push(desk(140, 128, 36, '#E64539'));
    s.push(desk(196, 128, 36, '#38B764'));
    /* 監査役メツケの独立席(藤紫) */
    s.push(desk(262, 126, 15, '#7B5FB5'));
    s.push('<rect x="258" y="122" width="1" height="18" fill="#7B5FB5"/>');

    /* 会議テーブル */
    s.push('<g><rect x="124" y="152" width="44" height="12" fill="#1A1C2C"/><rect x="125" y="153" width="42" height="10" fill="#F4EFDE"/>' +
      '<rect x="128" y="164" width="2" height="4" fill="#1A1C2C"/><rect x="162" y="164" width="2" height="4" fill="#1A1C2C"/>' +
      '<rect x="140" y="155" width="12" height="6" fill="#D9EDFD"/><rect x="140" y="155" width="12" height="1" fill="#41A6F6"/></g>');

    /* コーヒーコーナー */
    s.push('<g><rect x="282" y="152" width="32" height="12" fill="#1A1C2C"/><rect x="283" y="153" width="30" height="10" fill="#F4EFDE"/>' +
      '<rect x="286" y="146" width="8" height="7" fill="#1A1C2C"/><rect x="287" y="148" width="6" height="3" fill="#E64539"/>' +
      '<rect x="298" y="149" width="4" height="4" fill="#F4EFDE"/><rect x="298" y="149" width="4" height="1" fill="#3D4260"/>' +
      '<text x="305" y="150" font-size="7">&#9749;</text></g>');

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
  sceneEl.innerHTML = buildBackgroundSVG();

  var stageEl = document.createElement('div');
  stageEl.className = 'office-stage';
  sceneEl.appendChild(stageEl);

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

  /* ---------- 社員スプライト ---------- */
  var STATE_LABEL = {
    work: '🖥 作業中', coffee: '☕ 休憩中', meeting: '💬 会議中',
    wander: '🚶 巡回中', idle: '🌇 ひと息中'
  };
  var STATE_BUBBLE = { work: '💻', coffee: '☕', meeting: '💬', wander: '', idle: '…' };

  var emps = EMPLOYEES.map(function (e, idx) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'office-emp';
    el.setAttribute('aria-label', e.name + '(' + e.role + ')');
    var img = document.createElement('img');
    img.src = 'assets/avatars/' + encodeURIComponent(e.name) + '.svg';
    img.alt = '';
    img.draggable = false;
    var bub = document.createElement('span');
    bub.className = 'office-emp__bubble';
    el.appendChild(img);
    el.appendChild(bub);
    stageEl.appendChild(el);

    var seat = DEPT_SEATS[e.dept][idx % DEPT_SEATS[e.dept].length];
    return {
      def: e, el: el, img: img, bub: bub,
      seat: null, x: seat[0] + rand(-4, 4), y: seat[1] + rand(-2, 2),
      tx: seat[0], ty: seat[1], state: 'wander', timer: rand(0.5, 3),
      speed: rand(9, 14), facing: 1, activity: null, active: false,
      typeTimer: 0
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
    em.el.classList.toggle('is-working', em.state === 'work');
  }

  function nextState(em) {
    if (em.active) {
      /* 稼働中: 90% デスク作業、たまにコーヒー */
      if (Math.random() < 0.9) {
        em.state = 'work';
        em.tx = em.seat[0]; em.ty = em.seat[1];
        em.timer = rand(10, 24);
      } else {
        em.state = 'coffee';
        var cs = pick(COFFEE_SPOTS);
        em.tx = cs[0] + rand(-3, 3); em.ty = cs[1] + rand(-2, 2);
        em.timer = rand(5, 9);
      }
    } else {
      var roll = Math.random();
      if (roll < 0.45) {
        em.state = 'wander';
        em.tx = rand(WALK_AREA.x0, WALK_AREA.x1);
        em.ty = rand(WALK_AREA.y0, WALK_AREA.y1);
        em.timer = rand(2, 6);
      } else if (roll < 0.62) {
        em.state = 'coffee';
        var c2 = pick(COFFEE_SPOTS);
        em.tx = c2[0] + rand(-3, 3); em.ty = c2[1] + rand(-2, 2);
        em.timer = rand(6, 12);
      } else if (roll < 0.8) {
        em.state = 'meeting';
        var m2 = pick(MEETING_SPOTS);
        em.tx = m2[0] + rand(-2, 2); em.ty = m2[1];
        em.timer = rand(8, 16);
      } else {
        em.state = 'idle';
        em.tx = em.x + rand(-14, 14);
        em.ty = Math.min(WALK_AREA.y1, Math.max(WALK_AREA.y0, em.y + rand(-8, 8)));
        em.timer = rand(4, 9);
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

    var w = sceneEl.clientWidth || 1, h = sceneEl.clientHeight || 1;
    emps.forEach(function (em) {
      var dx = em.tx - em.x, dy = em.ty - em.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.6) {
        var step = em.speed * dt;
        em.x += dx / dist * Math.min(step, dist);
        em.y += dy / dist * Math.min(step, dist);
        if (Math.abs(dx) > 0.5) em.facing = dx < 0 ? -1 : 1;
        em.el.classList.add('is-moving');
      } else {
        em.el.classList.remove('is-moving');
        em.timer -= dt;
        if (em.timer <= 0) nextState(em);
      }
      /* タイピング演出(作業中は 💻 と ... を切替) */
      if (em.state === 'work') {
        em.typeTimer -= dt;
        if (em.typeTimer <= 0) {
          em.typeTimer = rand(1.2, 3);
          em.bub.textContent = em.bub.textContent === '💻' ? '…' : '💻';
        }
      }
      em.el.style.left = (em.x / VW * w) + 'px';
      em.el.style.top = (em.y / VH * h) + 'px';
      em.el.style.zIndex = 10 + Math.round(em.y);
      em.img.style.transform = em.facing < 0 ? 'scaleX(-1)' : '';
    });
  }
  function startLoop() { if (rafId === null) { lastT = null; rafId = requestAnimationFrame(frame); } }
  function stopLoop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopLoop(); else startLoop();
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
    var e = em.def;
    tipEl.innerHTML =
      '<strong>' + esc(e.name) + '</strong><small>(' + esc(e.role) + ')</small><br>' +
      '<span class="office-tip__dept" style="color:' + DEPT_COLOR[e.dept] + '">■</span> ' + esc(e.dept) + '<br>' +
      esc(STATE_LABEL[em.state] || '勤務中') + ' — ' + esc(activityLine(em));
    tipEl.classList.add('is-on');
    var w = sceneEl.clientWidth, h = sceneEl.clientHeight;
    var x = em.x / VW * w, y = em.y / VH * h;
    tipEl.style.left = Math.max(4, Math.min(w - tipEl.offsetWidth - 4, x - tipEl.offsetWidth / 2)) + 'px';
    var top = y - (em.el.offsetHeight + tipEl.offsetHeight + 10);
    tipEl.style.top = Math.max(4, top) + 'px';
  }
  function hideTip() { tipEl.classList.remove('is-on'); }

  function openPanel(em) {
    var e = em.def;
    panelEl.innerHTML =
      '<button type="button" class="office-panel__close" aria-label="閉じる">×</button>' +
      '<img class="office-panel__avatar" src="assets/avatars/' + encodeURIComponent(e.name) + '.svg" alt="' + esc(e.name) + 'のドット絵アバター">' +
      '<p class="office-panel__name dot">' + esc(e.name) + '</p>' +
      '<p class="office-panel__role">' + esc(e.role) + ' <span class="office-panel__dept" style="border-color:' + DEPT_COLOR[e.dept] + '">' + esc(e.dept) + '</span></p>' +
      '<p class="office-panel__blurb">' + esc(e.blurb) + '</p>' +
      '<p class="office-panel__act">' + esc(STATE_LABEL[em.state] || '勤務中') + ' — ' + esc(activityLine(em)) + '</p>' +
      '<p><a href="https://github.com/shotaro-nagano/ai-company/blob/main/agents/' + e.slug + '.md" rel="noopener">仕様書を見る(GitHub)→</a></p>';
    panelEl.classList.add('is-open');
    panelEl.querySelector('.office-panel__close').addEventListener('click', closePanel);
  }
  function closePanel() { panelEl.classList.remove('is-open'); }

  emps.forEach(function (em) {
    em.el.addEventListener('mouseenter', function () { showTip(em); });
    em.el.addEventListener('mouseleave', hideTip);
    em.el.addEventListener('focus', function () { showTip(em); });
    em.el.addEventListener('blur', hideTip);
    em.el.addEventListener('click', function (ev) { ev.stopPropagation(); openPanel(em); });
  });
  sceneEl.addEventListener('click', function (ev) {
    if (!panelEl.contains(ev.target)) closePanel();
  });

  /* ---------- HUD ---------- */
  function renderHUD(d) {
    var hp = Math.max(0, Math.min(100, d.hp_percent || 0));
    var exp = Math.max(0, Math.min(100, d.exp_percent || 0));
    hudEl.innerHTML =
      '<div class="office-hud__lv dot">Lv.' + (d.level || 1) + ' PixelYen</div>' +
      '<div class="office-hud__bar"><span class="dot">HP</span><span class="office-hud__track"><span class="office-hud__fill office-hud__fill--hp" style="width:' + hp + '%"></span></span></div>' +
      '<div class="office-hud__bar"><span class="dot">EXP</span><span class="office-hud__track"><span class="office-hud__fill office-hud__fill--exp" style="width:' + exp + '%"></span></span></div>' +
      '<div class="office-hud__money">今月売上 <span class="office-hud__num">' + yen(d.revenue_this_month) + '</span></div>' +
      '<div class="office-hud__money">純利益 <span class="office-hud__num">' + yen(d.profit_this_month) + '</span></div>' +
      '<a class="office-hud__link dot" href="dashboard.html">詳細ステータス→</a>';
  }

  /* ---------- オフィスタブ ---------- */
  function renderTabs(reg) {
    var html = '';
    (reg.offices || []).forEach(function (o) {
      html += '<span class="office-tab' + (o.id === 'hq' ? ' is-active' : '') + ' dot">🏢 ' + esc(o.name) + ' <small>' + esc((o.location || '').split('・')[1] ? 'みなとみらい' : '') + '</small></span>';
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

  var DEFAULT_DASH = { level: 1, hp_percent: 0, exp_percent: 0, revenue_this_month: null, profit_this_month: null, activity: {} };
  var DEFAULT_OFFICES = {
    offices: [{ id: 'hq', name: '本店', location: '神奈川県横浜市・みなとみらい', unlocked_at_level: 1, scene: 'minatomirai-rooftop' }],
    next_unlock: { level: 2, condition: '月商1万円', teaser: '新オフィス' }
  };

  Promise.all([
    fetchJSON('data/dashboard.json').catch(function () { return DEFAULT_DASH; }),
    fetchJSON('offices.json').catch(function () { return DEFAULT_OFFICES; })
  ]).then(function (res) {
    var dash = res[0] || DEFAULT_DASH;
    renderHUD(dash);
    renderTabs(res[1] || DEFAULT_OFFICES);
    var act = dash.activity || {};
    emps.forEach(function (em) {
      em.activity = act[em.def.slug] || null;
      em.active = !!(em.activity && em.activity.active_24h);
      nextState(em);
    });
    startLoop();
  }).catch(function () {
    renderHUD(DEFAULT_DASH);
    renderTabs(DEFAULT_OFFICES);
    emps.forEach(function (em) { nextState(em); });
    startLoop();
  });
})();
