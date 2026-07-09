/* ============================================================
   PixelYen ライブオフィス — みなとみらい・最上階ペントハウス(本店)
   素のJS/SVG/CSSのみ。dashboard.json / offices.json 取得失敗時は
   全員「勤務中」のデフォルト演出にフォールバックする。
   シーンは 3200x1100 のワイドSVG。ドラッグ/スワイプ/←→でパン、
   +/− でズーム(decisions.md #012: このシーンは8色縛り解除)。
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('live-office');
  if (!root) return;

  /* ---------- 定数(シーン論理座標: 3200 x 1100) ---------- */
  var VW = 3200, VH = 1100;

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

  /* デスク席(足元座標)— ゾーンごと */
  var DEPT_SEATS = {
    '経営':        [[215, 935], [330, 950], [445, 935], [270, 1010], [395, 1010]],
    'プロダクト':  [[665, 925], [782, 925], [900, 925], [720, 1005], [850, 1005]],
    'グロース':    [[1745, 920], [1860, 920], [1975, 920], [1800, 1000], [1920, 1000], [2040, 955]],
    'コーポレート': [[2205, 925], [2320, 925], [2435, 925], [2265, 1005], [2385, 1005]],
    '監査':        [[2705, 935]]
  };
  var COFFEE_SPOTS = [[2955, 990], [3030, 990], [3100, 985], [2990, 1045], [3070, 1045]];
  var MEETING_SPOTS = [[1225, 935], [1325, 935], [1425, 935], [1520, 940], [1275, 1015], [1470, 1015]];
  var WALK_AREA = { x0: 90, x1: 3130, y0: 800, y1: 1055 };

  /* ---------- 背景SVG(ペントハウス+夜景) ---------- */
  function buildBackgroundSVG() {
    var s = [];
    s.push('<svg class="office-bg" viewBox="0 0 3200 1100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">');

    /* ===== defs ===== */
    s.push('<defs>');
    s.push('<linearGradient id="oSky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#060a1c"/><stop offset="0.55" stop-color="#0d1533"/>' +
      '<stop offset="0.85" stop-color="#1c2750"/><stop offset="1" stop-color="#2a3560"/></linearGradient>');
    s.push('<linearGradient id="oSea" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#101b3d"/><stop offset="1" stop-color="#060b1e"/></linearGradient>');
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
    s.push('<radialGradient id="oPool" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffca7a" stop-opacity="0.30"/><stop offset="0.7" stop-color="#ffb85c" stop-opacity="0.10"/>' +
      '<stop offset="1" stop-color="#ffb85c" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="oPoolCool" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#bcd7ff" stop-opacity="0.16"/><stop offset="1" stop-color="#bcd7ff" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="oMoonGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#fdf6d8" stop-opacity="0.9"/><stop offset="0.35" stop-color="#fdf6d8" stop-opacity="0.25"/>' +
      '<stop offset="1" stop-color="#fdf6d8" stop-opacity="0"/></radialGradient>');
    s.push('<radialGradient id="oLampGlow" cx="0.5" cy="0.5" r="0.5">' +
      '<stop offset="0" stop-color="#ffd88a" stop-opacity="0.85"/><stop offset="1" stop-color="#ffd88a" stop-opacity="0"/></radialGradient>');
    s.push('<filter id="oBlurS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>');
    s.push('<filter id="oBlurM" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>');
    s.push('<filter id="oBlurL" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="34"/></filter>');
    /* 寄木(ヘリンボーン)パターン */
    s.push('<pattern id="oHerring" width="120" height="60" patternUnits="userSpaceOnUse" patternTransform="translate(0 748)">' +
      '<rect width="120" height="60" fill="#54392a"/>' +
      '<path d="M0 60 L60 0 L74 0 L0 74 Z" fill="#5f4330"/>' +
      '<path d="M60 60 L120 0 L134 0 L60 74 Z" fill="#4a3222"/>' +
      '<path d="M-14 14 L46 74 L60 74 L0 14 Z" fill="#67492f" opacity="0.55"/>' +
      '<path d="M0 0 L120 0" stroke="#3a281b" stroke-width="1.5"/>' +
      '<path d="M0 60 L60 0 M60 60 L120 0" stroke="#3a281b" stroke-width="1.5"/></pattern>');
    s.push('</defs>');

    /* ===== 夜空 ===== */
    s.push('<rect x="0" y="0" width="3200" height="640" fill="url(#oSky)"/>');
    /* 星 */
    var st = [[120,120],[260,80],[420,180],[540,60],[700,140],[860,90],[1020,200],[1180,70],[1350,150],[1500,100],[1680,60],[1840,170],[2000,110],[2160,80],[2330,190],[2480,140],[2620,70],[2760,160],[2930,100],[3080,180],[330,240],[980,260],[1580,230],[2250,250],[2880,240],[760,220],[2050,220]];
    for (var i = 0; i < st.length; i++) {
      s.push('<circle class="office-star office-star--' + (i % 3) + '" cx="' + st[i][0] + '" cy="' + st[i][1] + '" r="' + (i % 4 === 0 ? 2.4 : 1.5) + '" fill="#dfe8ff"/>');
    }
    /* 月 */
    s.push('<circle cx="2860" cy="150" r="110" fill="url(#oMoonGlow)"/>');
    s.push('<circle cx="2860" cy="150" r="34" fill="#f6eecb"/><circle cx="2872" cy="140" r="7" fill="#e8dfb4" opacity="0.7"/><circle cx="2848" cy="160" r="5" fill="#e8dfb4" opacity="0.6"/>');
    /* 飛行機(点滅しつつ横断) */
    s.push('<g class="office-plane"><rect x="-14" y="-2" width="28" height="4" rx="2" fill="#9aa6c8"/>' +
      '<circle class="office-plane__beacon" cx="0" cy="-4" r="3" fill="#ff5a4e"/></g>');

    /* ===== 遠景スカイライン ===== */
    s.push('<g fill="#141b38">' +
      '<rect x="60" y="470" width="120" height="130"/><rect x="230" y="500" width="90" height="100"/>' +
      '<rect x="380" y="450" width="140" height="150"/><rect x="590" y="510" width="100" height="90"/>' +
      '<rect x="1650" y="490" width="110" height="110"/><rect x="2560" y="470" width="130" height="130"/>' +
      '<rect x="2760" y="505" width="100" height="95"/><rect x="3010" y="480" width="150" height="120"/></g>');
    /* クイーンズスクエア(階段状3連) */
    s.push('<g fill="#1b2246">' +
      '<path d="M760 600 L760 330 L900 330 L900 600 Z"/>' +
      '<path d="M910 600 L910 395 L1040 395 L1040 600 Z"/>' +
      '<path d="M1050 600 L1050 455 L1170 455 L1170 600 Z"/>' +
      '<rect x="790" y="312" width="80" height="18"/><rect x="935" y="378" width="76" height="17"/><rect x="1072" y="440" width="72" height="15"/></g>');
    /* ランドマークタワー(台形シルエット) */
    s.push('<g fill="#1b2246">' +
      '<path d="M2080 600 L2110 430 L2160 430 L2180 260 L2220 190 L2240 140 L2260 190 L2300 260 L2320 430 L2370 430 L2400 600 Z"/>' +
      '<rect x="2232" y="96" width="16" height="46"/><circle class="office-beacon" cx="2240" cy="90" r="6" fill="#ff5a4e"/></g>');
    /* ビル窓の点灯 */
    var wins = [];
    var bl = [[770,345,130,240],[918,408,115,180],[1058,468,105,120],[2130,440,230,150],[2200,270,110,150],[70,485,100,100],[390,465,120,120],[2570,485,110,100],[3020,495,130,90]];
    for (var b = 0; b < bl.length; b++) {
      var bb = bl[b];
      for (var wy = bb[1]; wy < bb[1] + bb[3]; wy += 26) {
        for (var wx = bb[0]; wx < bb[0] + bb[2]; wx += 24) {
          if (Math.random() < 0.42) wins.push([wx, wy]);
        }
      }
    }
    for (var wI = 0; wI < wins.length; wI++) {
      s.push('<rect class="office-win office-win--' + (wI % 5) + '" x="' + wins[wI][0] + '" y="' + wins[wI][1] + '" width="9" height="6" rx="1" fill="' + (wI % 7 === 0 ? '#ffe9a8' : '#f5c86a') + '" opacity="0.85"/>');
    }

    /* ===== 観覧車(コスモクロック風・虹色電飾・回転) ===== */
    var FW_X = 1380, FW_Y = 400, FW_R = 155;
    s.push('<g>');
    s.push('<path d="M' + (FW_X - 70) + ' 600 L' + FW_X + ' ' + FW_Y + ' L' + (FW_X + 70) + ' 600 Z" fill="none" stroke="#2a3560" stroke-width="10"/>');
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="' + (FW_R + 10) + '" fill="#0d1533" opacity="0.35" filter="url(#oBlurM)"/>');
    s.push('<g class="office-wheel" style="transform-origin:' + FW_X + 'px ' + FW_Y + 'px">');
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="' + FW_R + '" fill="none" stroke="#39446e" stroke-width="6"/>');
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="' + (FW_R - 26) + '" fill="none" stroke="#39446e" stroke-width="3" opacity="0.7"/>');
    var RAINBOW = ['#ff5a5a', '#ffa14e', '#ffe14e', '#69e07a', '#5bc4f5', '#7a8cf0', '#c07af0', '#ff7ac9'];
    for (var k = 0; k < 16; k++) {
      var ang = k * Math.PI / 8;
      var gx = FW_X + Math.cos(ang) * FW_R, gy = FW_Y + Math.sin(ang) * FW_R;
      s.push('<line x1="' + FW_X + '" y1="' + FW_Y + '" x2="' + gx.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#39446e" stroke-width="2.5"/>');
      var col = RAINBOW[k % 8];
      s.push('<circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" r="11" fill="' + col + '"/>' +
        '<circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" r="16" fill="' + col + '" opacity="0.45" filter="url(#oBlurS)"/>');
    }
    s.push('<circle cx="' + FW_X + '" cy="' + FW_Y + '" r="26" fill="#1b2246" stroke="#ffd88a" stroke-width="4"/>');
    s.push('</g>');
    /* リムの電飾(回転と逆位相で色が流れて見える) */
    s.push('<circle class="office-wheel-glow" cx="' + FW_X + '" cy="' + FW_Y + '" r="' + FW_R + '" fill="none" stroke="#ffd88a" stroke-width="2" opacity="0.5" stroke-dasharray="8 22"/>');
    s.push('</g>');

    /* ===== 港の水面(反射) ===== */
    s.push('<rect x="0" y="600" width="3200" height="150" fill="url(#oSea)"/>');
    /* 反射: 観覧車の虹・タワー・月 */
    for (var rk = 0; rk < 8; rk++) {
      s.push('<rect class="office-refl office-refl--' + (rk % 4) + '" x="' + (FW_X - 120 + rk * 32) + '" y="604" width="14" height="' + (56 + (rk % 3) * 26) + '" fill="' + RAINBOW[rk] + '" opacity="0.25" filter="url(#oBlurS)"/>');
    }
    s.push('<rect class="office-refl office-refl--1" x="2210" y="604" width="46" height="96" fill="#f5c86a" opacity="0.20" filter="url(#oBlurS)"/>');
    s.push('<rect class="office-refl office-refl--2" x="2836" y="604" width="48" height="120" fill="#f6eecb" opacity="0.22" filter="url(#oBlurS)"/>');
    var gl = [[180, 640], [560, 690], [940, 655], [1720, 640], [2060, 700], [2520, 660], [2980, 690], [1240, 705]];
    for (var g2 = 0; g2 < gl.length; g2++) {
      s.push('<rect class="office-glint office-glint--' + (g2 % 3) + '" x="' + gl[g2][0] + '" y="' + gl[g2][1] + '" width="70" height="3" rx="1.5" fill="#9db6e8" opacity="0.5"/>');
    }

    /* 手前の埠頭ライン */
    s.push('<rect x="0" y="726" width="3200" height="14" fill="#0a0f24"/>');

    /* ===== 室内 ===== */
    /* 床(ヘリンボーン) */
    s.push('<rect x="0" y="740" width="3200" height="360" fill="url(#oFloor)"/>');
    s.push('<rect x="0" y="740" width="3200" height="360" fill="url(#oHerring)" opacity="0.85"/>');
    /* 窓際の床への夜景の淡い映り */
    s.push('<rect x="0" y="740" width="3200" height="70" fill="#8fb2ee" opacity="0.07"/>');

    /* 全面ガラス: 方立(マリオン)+室内照明のうっすら映り込み */
    for (var mx = 0; mx <= 3200; mx += 320) {
      s.push('<rect x="' + (mx - 5) + '" y="86" width="10" height="656" fill="#0b0e1d"/>');
    }
    s.push('<rect x="0" y="736" width="3200" height="8" fill="#0b0e1d"/>');
    s.push('<rect x="0" y="404" width="3200" height="4" fill="#0b0e1d" opacity="0.85"/>');
    /* ガラスの映り込み(斜めのハイライト) */
    s.push('<g opacity="0.05" fill="#dce8ff">' +
      '<path d="M240 86 L560 86 L260 740 L-60 740 Z"/>' +
      '<path d="M1360 86 L1500 86 L1200 740 L1060 740 Z"/>' +
      '<path d="M2480 86 L2800 86 L2500 740 L2180 740 Z"/></g>');
    /* 室内照明の窓への映り込み(ぼんやり暖色) */
    s.push('<g filter="url(#oBlurL)" opacity="0.10" fill="#ffca7a">' +
      '<ellipse cx="300" cy="560" rx="150" ry="60"/><ellipse cx="1370" cy="540" rx="170" ry="55"/>' +
      '<ellipse cx="3000" cy="560" rx="160" ry="60"/></g>');

    /* 天井: 間接照明(コーブ)+ダウンライト */
    s.push('<rect x="0" y="0" width="3200" height="86" fill="#14100d"/>');
    s.push('<rect x="0" y="80" width="3200" height="10" fill="#ffca7a" opacity="0.35" filter="url(#oBlurM)"/>');
    s.push('<rect x="0" y="84" width="3200" height="3" fill="#ffdf9e" opacity="0.8"/>');
    for (var dl = 160; dl < 3200; dl += 320) {
      s.push('<circle cx="' + dl + '" cy="52" r="12" fill="#241d15"/><circle cx="' + dl + '" cy="56" r="7" fill="#ffdf9e"/>' +
        '<circle cx="' + dl + '" cy="60" r="18" fill="#ffdf9e" opacity="0.3" filter="url(#oBlurS)"/>');
    }

    /* 各ゾーンの床への光だまり(暖色) */
    var pools = [[300, 940, 330, 130], [790, 935, 340, 130], [1370, 950, 330, 130], [1890, 935, 330, 130], [2320, 940, 320, 125], [2705, 950, 170, 100], [3010, 985, 250, 115]];
    for (var p = 0; p < pools.length; p++) {
      s.push('<ellipse cx="' + pools[p][0] + '" cy="' + pools[p][1] + '" rx="' + pools[p][2] + '" ry="' + pools[p][3] + '" fill="url(#oPool)" filter="url(#oBlurM)"/>');
    }
    s.push('<ellipse cx="1370" cy="960" rx="240" ry="100" fill="url(#oPoolCool)" filter="url(#oBlurM)"/>');

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

    /* ==== Zone 1: エグゼクティブラウンジ(60-520) ==== */
    s.push(rug(300, 950, 430, 220, '#7a3b2e'));
    /* 額装ロゴ(壁ではなく窓際のイーゼル風パネル) */
    s.push('<g>' + shadow(105, 872, 40, 10) +
      '<rect x="60" y="700" width="90" height="120" rx="4" fill="#241c12" stroke="#c9a86a" stroke-width="4"/>' +
      '<rect x="72" y="714" width="66" height="66" rx="3" fill="#f4efde"/>' +
      '<text x="105" y="758" text-anchor="middle" font-size="34" fill="#1A1C2C" font-family="serif" font-weight="bold">¥</text>' +
      '<text x="105" y="800" text-anchor="middle" font-size="13" fill="#e8d9b0" font-family="sans-serif" letter-spacing="2">PIXELYEN</text>' +
      '<line x1="80" y1="820" x2="70" y2="872" stroke="#241c12" stroke-width="5"/><line x1="130" y1="820" x2="140" y2="872" stroke="#241c12" stroke-width="5"/></g>');
    /* 一枚板ウォールナットデスク */
    s.push('<g>' + shadow(330, 906, 190, 24) +
      '<path d="M150 848 C 220 838, 440 838, 510 850 L 505 878 C 430 868, 230 868, 155 876 Z" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<path d="M155 850 C 240 843, 430 843, 502 852" stroke="#7a5636" stroke-width="2.5" fill="none" opacity="0.8"/>' +
      '<path d="M160 858 C 250 851, 420 851, 498 860" stroke="#8a6540" stroke-width="1.5" fill="none" opacity="0.5"/>' +
      '<rect x="180" y="876" width="14" height="34" fill="#241a10"/><rect x="466" y="876" width="14" height="34" fill="#241a10"/></g>');
    s.push(monitor(330, 846, 62, false));
    /* 真鍮スタンドライト */
    s.push('<g>' + shadow(490, 918, 26, 8) +
      '<line x1="490" y1="916" x2="490" y2="760" stroke="#b08d4f" stroke-width="6"/>' +
      '<path d="M462 760 L518 760 L506 726 L474 726 Z" fill="#caa55d"/>' +
      '<ellipse cx="490" cy="762" rx="26" ry="7" fill="#ffdf9e"/>' +
      '<ellipse cx="490" cy="790" rx="60" ry="46" fill="url(#oLampGlow)" filter="url(#oBlurM)"/>' +
      '<path d="M470 916 L510 916" stroke="#b08d4f" stroke-width="7"/></g>');
    /* 革のラウンジチェア x2 */
    s.push('<g>' + shadow(150, 990, 46, 13) +
      '<path d="M110 990 L110 930 Q110 912 128 912 L172 912 Q190 912 190 930 L190 990 Z" fill="#6e3a28"/>' +
      '<path d="M118 986 L118 946 Q118 936 130 936 L170 936 Q182 936 182 946 L182 986 Z" fill="#8a4c34"/>' +
      '<rect x="104" y="954" width="14" height="34" rx="7" fill="#5d3021"/><rect x="182" y="954" width="14" height="34" rx="7" fill="#5d3021"/></g>');
    s.push('<g>' + shadow(255, 1044, 46, 13) +
      '<path d="M215 1044 L215 984 Q215 966 233 966 L277 966 Q295 966 295 984 L295 1044 Z" fill="#6e3a28"/>' +
      '<path d="M223 1040 L223 1000 Q223 990 235 990 L275 990 Q287 990 287 1000 L287 1040 Z" fill="#8a4c34"/>' +
      '<rect x="209" y="1008" width="14" height="34" rx="7" fill="#5d3021"/><rect x="287" y="1008" width="14" height="34" rx="7" fill="#5d3021"/></g>');
    s.push(chair(330, 962));
    s.push(chair(445, 948));
    s.push(plant(50, 1030, 1.15, 'monstera'));

    /* ==== Zone 2: プロダクトスタジオ(560-1080) ==== */
    s.push(rug(790, 955, 470, 210, '#274a66'));
    /* ホワイトボード(自立式・窓前) */
    s.push('<g>' + shadow(620, 884, 90, 12) +
      '<rect x="530" y="700" width="180" height="120" rx="6" fill="#f6f4ee" stroke="#8a8f9a" stroke-width="4"/>' +
      '<path d="M548 726 C 570 716, 600 736, 630 722" stroke="#5bb8f5" stroke-width="4" fill="none"/>' +
      '<path d="M548 752 L 640 752 M548 770 L 616 770" stroke="#a7aab2" stroke-width="4"/>' +
      '<path d="M652 736 l16 -14 M652 722 l16 14" stroke="#f0705f" stroke-width="4"/>' +
      '<rect x="560" y="792" width="60" height="8" rx="4" fill="#c2c6ce"/>' +
      '<line x1="548" y1="820" x2="540" y2="882" stroke="#8a8f9a" stroke-width="6"/><line x1="692" y1="820" x2="700" y2="882" stroke="#8a8f9a" stroke-width="6"/></g>');
    /* 大ワークテーブル(デュアルモニター) */
    s.push('<g>' + shadow(790, 898, 230, 24) +
      '<rect x="580" y="840" width="420" height="34" rx="8" fill="url(#oWhiteTable)" stroke="#a89f8d" stroke-width="2"/>' +
      '<rect x="600" y="874" width="14" height="36" fill="#3a3a42"/><rect x="966" y="874" width="14" height="36" fill="#3a3a42"/></g>');
    s.push(monitor(672, 836, 52, true));
    s.push(monitor(880, 836, 52, true));
    s.push(chair(665, 950)); s.push(chair(782, 950)); s.push(chair(900, 950));
    s.push(chair(720, 1030, '#33414e')); s.push(chair(850, 1030, '#33414e'));
    s.push(plant(1050, 1040, 1.1, 'olive'));

    /* ==== Zone 3: ガラス会議室(1120-1620) ==== */
    /* ガラスパーティション(細い黒枠+半透明) */
    s.push('<g>' +
      '<rect x="1108" y="640" width="8" height="420" fill="#101018"/>' +
      '<rect x="1624" y="640" width="8" height="420" fill="#101018"/>' +
      '<rect x="1108" y="640" width="524" height="6" fill="#101018"/>' +
      '<rect x="1116" y="646" width="508" height="410" fill="url(#oGlassPart)"/>' +
      '<path d="M1150 660 L1240 660 L1180 1040 L1090 1040 Z" fill="#dce8ff" opacity="0.06"/>' +
      '<path d="M1480 660 L1560 660 L1500 1040 L1420 1040 Z" fill="#dce8ff" opacity="0.05"/>' +
      '<rect x="1116" y="846" width="508" height="3" fill="#dce8ff" opacity="0.14"/></g>');
    s.push(pendant(1270, 88, 690)); s.push(pendant(1370, 88, 660)); s.push(pendant(1470, 88, 690));
    /* 長い会議テーブル */
    s.push('<g>' + shadow(1372, 960, 250, 26) +
      '<rect x="1150" y="900" width="445" height="40" rx="20" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<path d="M1170 908 C 1280 902, 1470 902, 1576 910" stroke="#7a5636" stroke-width="2" fill="none" opacity="0.7"/>' +
      '<rect x="1200" y="940" width="16" height="38" fill="#241a10"/><rect x="1530" y="940" width="16" height="38" fill="#241a10"/></g>');
    for (var mc = 0; mc < 4; mc++) s.push(chair(1225 + mc * 100, 968, '#3c3129'));
    s.push(chair(1275, 1046, '#3c3129')); s.push(chair(1470, 1046, '#3c3129'));
    s.push(plant(1600, 1046, 0.9, 'monstera'));

    /* ==== Zone 4: グロースハブ(1660-2100) ==== */
    s.push(rug(1890, 950, 420, 200, '#8a3a30'));
    /* 成長グラフのアートパネル(窓前ボード) */
    s.push('<g>' + shadow(1730, 880, 84, 11) +
      '<rect x="1650" y="694" width="160" height="122" rx="6" fill="#17171f" stroke="#c9a86a" stroke-width="3"/>' +
      '<path d="M1668 792 L1700 764 L1726 776 L1758 726 L1790 706" stroke="#f0705f" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="1790" cy="706" r="6" fill="#ffd88a"/>' +
      '<path d="M1668 800 L1794 800" stroke="#3a3a48" stroke-width="2"/>' +
      '<line x1="1668" y1="816" x2="1660" y2="878" stroke="#c9a86a" stroke-width="5"/><line x1="1792" y1="816" x2="1800" y2="878" stroke="#c9a86a" stroke-width="5"/></g>');
    /* スタンディングデスク x3 */
    for (var sd = 0; sd < 3; sd++) {
      var sx = 1745 + sd * 115;
      s.push('<g>' + shadow(sx, 882, 62, 12) +
        '<rect x="' + (sx - 58) + '" y="826" width="116" height="20" rx="6" fill="url(#oWhiteTable)" stroke="#a89f8d" stroke-width="2"/>' +
        '<rect x="' + (sx - 42) + '" y="846" width="8" height="34" fill="#3a3a42"/><rect x="' + (sx + 34) + '" y="846" width="8" height="34" fill="#3a3a42"/></g>');
      s.push(monitor(sx, 822, 46, false));
    }
    /* 低めの共有デスク */
    s.push('<g>' + shadow(1862, 972, 130, 18) +
      '<rect x="1745" y="928" width="235" height="26" rx="8" fill="url(#oWalnut)"/>' +
      '<rect x="1765" y="954" width="12" height="28" fill="#241a10"/><rect x="1940" y="954" width="12" height="28" fill="#241a10"/></g>');
    s.push(chair(1800, 1024)); s.push(chair(1920, 1024)); s.push(chair(2040, 985, '#43333a'));
    s.push(plant(2085, 1042, 1.0, 'olive'));

    /* ==== Zone 5: コーポレートウィング(2140-2580) ==== */
    s.push(rug(2320, 950, 400, 195, '#2f5a44'));
    /* 書棚 */
    s.push('<g>' + shadow(2165, 902, 70, 11) +
      '<rect x="2110" y="672" width="112" height="228" rx="4" fill="#33241a" stroke="#211710" stroke-width="3"/>');
    for (var sh = 0; sh < 4; sh++) {
      var sy2 = 690 + sh * 52;
      s.push('<rect x="2118" y="' + (sy2 + 38) + '" width="96" height="5" fill="#211710"/>');
      var cols = ['#7a4a3a', '#4a6a58', '#5a5a7a', '#8a6a3a', '#6a4a5a'];
      for (var bk = 0; bk < 6; bk++) {
        s.push('<rect x="' + (2122 + bk * 15) + '" y="' + (sy2 + 6 + (bk % 3) * 2) + '" width="11" height="' + (32 - (bk % 3) * 2) + '" rx="1.5" fill="' + cols[(sh + bk) % 5] + '"/>');
      }
    }
    s.push('</g>');
    /* 整然としたデスク */
    s.push('<g>' + shadow(2320, 898, 200, 22) +
      '<rect x="2140" y="842" width="360" height="30" rx="8" fill="url(#oWhiteTable)" stroke="#a89f8d" stroke-width="2"/>' +
      '<rect x="2160" y="872" width="13" height="36" fill="#3a3a42"/><rect x="2467" y="872" width="13" height="36" fill="#3a3a42"/></g>');
    s.push(monitor(2230, 838, 48, false)); s.push(monitor(2410, 838, 48, false));
    s.push(chair(2205, 950)); s.push(chair(2320, 950)); s.push(chair(2435, 950));
    s.push(chair(2265, 1030, '#3a4a40')); s.push(chair(2385, 1030, '#3a4a40'));
    /* 金庫(「¥0」の貼り紙=支出ゼロ運営) */
    s.push('<g>' + shadow(2540, 986, 46, 12) +
      '<rect x="2500" y="890" width="82" height="94" rx="6" fill="#454a54" stroke="#2b2e36" stroke-width="3"/>' +
      '<rect x="2508" y="898" width="66" height="78" rx="4" fill="#565c68"/>' +
      '<circle cx="2541" cy="936" r="13" fill="#3a3e46" stroke="#8a909c" stroke-width="3"/>' +
      '<line x1="2541" y1="936" x2="2549" y2="928" stroke="#c2c6ce" stroke-width="2.5"/>' +
      '<rect x="2515" y="902" width="34" height="24" rx="2" fill="#f4efde" transform="rotate(-4 2532 914)"/>' +
      '<text x="2532" y="920" text-anchor="middle" font-size="16" font-weight="bold" fill="#1A1C2C" font-family="sans-serif" transform="rotate(-4 2532 914)">¥0</text></g>');

    /* ==== Zone 6: 監査室(独立ブース 2620-2820) ==== */
    s.push('<g>' +
      '<rect x="2612" y="640" width="7" height="420" fill="#101018"/>' +
      '<rect x="2828" y="640" width="7" height="420" fill="#101018"/>' +
      '<rect x="2612" y="640" width="223" height="5" fill="#101018"/>' +
      '<rect x="2619" y="645" width="209" height="415" fill="#9d85d2" opacity="0.09"/>' +
      '<path d="M2650 660 L2700 660 L2660 1040 L2610 1040 Z" fill="#dce8ff" opacity="0.05"/></g>');
    s.push('<text x="2724" y="676" text-anchor="middle" font-size="17" fill="#b8a8dd" font-family="sans-serif" letter-spacing="4" opacity="0.85">AUDIT</text>');
    s.push(pendant(2724, 88, 700, '#d9c8ff'));
    s.push('<g>' + shadow(2724, 900, 96, 15) +
      '<rect x="2640" y="848" width="168" height="26" rx="7" fill="url(#oWalnut)" stroke="#2b1c10" stroke-width="2"/>' +
      '<rect x="2656" y="874" width="12" height="30" fill="#241a10"/><rect x="2780" y="874" width="12" height="30" fill="#241a10"/></g>');
    s.push(monitor(2724, 844, 48, false));
    s.push(chair(2705, 960, '#443a5a'));
    s.push(plant(2800, 1042, 0.85, 'monstera'));

    /* ==== Zone 7: バーラウンジ/エスプレッソバー(2870-3180) ==== */
    s.push(rug(3020, 1005, 300, 165, '#5a4a2e'));
    s.push(pendant(2950, 88, 640)); s.push(pendant(3040, 88, 620)); s.push(pendant(3130, 88, 640));
    /* カウンター */
    s.push('<g>' + shadow(3020, 950, 170, 20) +
      '<rect x="2880" y="820" width="290" height="118" rx="6" fill="#241f26" stroke="#151218" stroke-width="2"/>' +
      '<rect x="2872" y="806" width="306" height="22" rx="8" fill="url(#oBarTop)" stroke="#000" stroke-width="1.5"/>' +
      '<rect x="2872" y="808" width="306" height="4" rx="2" fill="#5a5a66" opacity="0.6"/>' +
      /* 棚のボトル(バックカウンターの気配: カウンター面に置く) */
      '<rect x="2896" y="774" width="12" height="34" rx="4" fill="#7a9a5a" opacity="0.9"/>' +
      '<rect x="2916" y="768" width="12" height="40" rx="4" fill="#9a6a4a" opacity="0.9"/>' +
      '<rect x="2936" y="778" width="12" height="30" rx="4" fill="#5a7a9a" opacity="0.9"/>' +
      /* エスプレッソマシン */
      '<rect x="3062" y="762" width="86" height="46" rx="6" fill="#8f959e" stroke="#5a5e66" stroke-width="2"/>' +
      '<rect x="3070" y="754" width="70" height="10" rx="4" fill="#6a6e76"/>' +
      '<rect x="3082" y="796" width="10" height="10" fill="#3a3e46"/><rect x="3116" y="796" width="10" height="10" fill="#3a3e46"/>' +
      '<circle cx="3140" cy="774" r="5" fill="#f0705f"/>' +
      '<rect x="3006" y="788" width="18" height="18" rx="3" fill="#f4efde"/><rect x="3006" y="788" width="18" height="4" rx="2" fill="#8a6a4a"/>' +
      '<path class="office-steam" d="M3014 782 C 3010 774, 3018 770, 3014 762" stroke="#dfe8ff" stroke-width="2.5" fill="none" opacity="0.6"/></g>');
    /* スツール */
    for (var stl = 0; stl < 4; stl++) {
      var stx = 2930 + stl * 62;
      s.push('<g>' + shadow(stx, 1000, 24, 8) +
        '<ellipse cx="' + stx + '" cy="960" rx="22" ry="9" fill="#6e3a28"/>' +
        '<ellipse cx="' + stx + '" cy="956" rx="22" ry="9" fill="#8a4c34"/>' +
        '<line x1="' + stx + '" y1="964" x2="' + stx + '" y2="996" stroke="#b08d4f" stroke-width="5"/>' +
        '<ellipse cx="' + stx + '" cy="997" rx="14" ry="4" fill="none" stroke="#b08d4f" stroke-width="3.5"/></g>');
    }
    s.push(plant(3168, 1044, 1.05, 'monstera'));

    /* 全体の空気(手前をわずかに暗く締める) */
    s.push('<rect x="0" y="1060" width="3200" height="40" fill="#000" opacity="0.28" filter="url(#oBlurM)"/>');

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
  sceneEl.innerHTML = '';
  sceneEl.setAttribute('tabindex', '0');

  var worldEl = document.createElement('div');
  worldEl.className = 'office-world';
  worldEl.innerHTML = buildBackgroundSVG();
  sceneEl.appendChild(worldEl);

  var stageEl = document.createElement('div');
  stageEl.className = 'office-stage';
  worldEl.appendChild(stageEl);

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

  var dragNote = document.createElement('div');
  dragNote.className = 'office-dragnote';
  dragNote.textContent = '← ドラッグで移動 →';
  sceneEl.appendChild(dragNote);

  /* ---------- パン/ズーム エンジン ---------- */
  var view = { pan: 0, panY: 0, zoom: 1, vel: 0, worldW: 0, worldH: 0, dragging: false, moved: false };

  function layout() {
    var vw = sceneEl.clientWidth || 1, vh = sceneEl.clientHeight || 1;
    var scale = (vh / VH) * view.zoom;
    view.worldW = VW * scale;
    view.worldH = VH * scale;
    worldEl.style.width = view.worldW + 'px';
    worldEl.style.height = view.worldH + 'px';
    view.panY = Math.min(0, (vh - view.worldH) / 2);
    clampPan();
    applyPan();
  }
  function clampPan() {
    var vw = sceneEl.clientWidth || 1;
    var min = Math.min(0, vw - view.worldW);
    if (view.pan > 0) view.pan = 0;
    if (view.pan < min) view.pan = min;
  }
  function applyPan() {
    worldEl.style.transform = 'translate3d(' + view.pan.toFixed(2) + 'px,' + view.panY.toFixed(2) + 'px,0)';
    var vw = sceneEl.clientWidth || 1;
    var min = Math.min(0, vw - view.worldW);
    hintL.classList.toggle('is-on', view.pan < -8);
    hintR.classList.toggle('is-on', view.pan > min + 8);
  }
  function setZoom(z) {
    z = Math.max(1, Math.min(1.5, z));
    if (z === view.zoom) return;
    var vw = sceneEl.clientWidth || 1;
    var ratio = z / view.zoom;
    view.pan = (view.pan - vw / 2) * ratio + vw / 2;
    view.zoom = z;
    layout();
  }
  zoomWrap.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.office-zoom__btn');
    if (!btn) return;
    setZoom(view.zoom + Number(btn.getAttribute('data-z')) * 0.25);
  });

  /* ドラッグ/スワイプ(Pointer Events) */
  var drag = { id: null, lastX: 0, lastT: 0, startX: 0, startY: 0 };
  sceneEl.addEventListener('pointerdown', function (ev) {
    if (ev.target.closest('.office-panel, .office-hud, .office-zoom')) return;
    drag.id = ev.pointerId;
    drag.lastX = ev.clientX; drag.lastT = performance.now();
    drag.startX = ev.clientX; drag.startY = ev.clientY;
    view.dragging = true; view.moved = false; view.vel = 0;
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
      view.vel = 0;
      clampPan(); applyPan();
      dragNote.classList.add('is-hidden');
      ev.preventDefault();
    }
  });

  window.addEventListener('resize', layout);
  layout();
  /* 初期位置: 少しだけ中へ(プロダクトスタジオが見える位置) */
  view.pan = -(view.worldW * 0.06);
  clampPan(); applyPan();

  /* ---------- 社員スプライト ---------- */
  var STATE_LABEL = {
    work: '🖥 作業中', coffee: '☕ 休憩中', meeting: '💬 会議中',
    wander: '🚶 巡回中', idle: '🌃 ひと息中'
  };
  var STATE_BUBBLE = { work: '💻', coffee: '☕', meeting: '💬', wander: '', idle: '…' };

  var emps = EMPLOYEES.map(function (e, idx) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'office-emp';
    el.setAttribute('aria-label', e.name + '(' + e.role + ')');
    var img = document.createElement('img');
    img.src = 'assets/avatars/office/' + encodeURIComponent(e.name) + '.svg';
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
      seat: null, x: seat[0] + rand(-30, 30), y: seat[1] + rand(-15, 15),
      tx: seat[0], ty: seat[1], state: 'wander', timer: rand(0.5, 3),
      speed: rand(95, 145), facing: 1, activity: null, active: false,
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
      /* 稼働中: 90% デスク作業、たまにバーで一杯 */
      if (Math.random() < 0.9) {
        em.state = 'work';
        em.tx = em.seat[0]; em.ty = em.seat[1];
        em.timer = rand(10, 24);
      } else {
        em.state = 'coffee';
        var cs = pick(COFFEE_SPOTS);
        em.tx = cs[0] + rand(-20, 20); em.ty = cs[1] + rand(-10, 10);
        em.timer = rand(5, 9);
      }
    } else {
      var roll = Math.random();
      if (roll < 0.45) {
        /* フロア全域を歩き回る(ゾーン間の移動) */
        em.state = 'wander';
        em.tx = rand(WALK_AREA.x0, WALK_AREA.x1);
        em.ty = rand(WALK_AREA.y0, WALK_AREA.y1);
        em.timer = rand(2, 6);
      } else if (roll < 0.62) {
        em.state = 'coffee';
        var c2 = pick(COFFEE_SPOTS);
        em.tx = c2[0] + rand(-20, 20); em.ty = c2[1] + rand(-10, 10);
        em.timer = rand(6, 12);
      } else if (roll < 0.8) {
        em.state = 'meeting';
        var m2 = pick(MEETING_SPOTS);
        em.tx = m2[0] + rand(-15, 15); em.ty = m2[1];
        em.timer = rand(8, 16);
      } else {
        em.state = 'idle';
        em.tx = em.x + rand(-120, 120);
        em.tx = Math.min(WALK_AREA.x1, Math.max(WALK_AREA.x0, em.tx));
        em.ty = Math.min(WALK_AREA.y1, Math.max(WALK_AREA.y0, em.y + rand(-60, 60)));
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

    /* 慣性スクロール */
    if (!view.dragging && Math.abs(view.vel) > 4) {
      view.pan += view.vel * dt;
      view.vel *= Math.pow(0.06, dt); /* 減衰 */
      clampPan();
      applyPan();
    }

    emps.forEach(function (em) {
      var dx = em.tx - em.x, dy = em.ty - em.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 4) {
        var step = em.speed * dt;
        em.x += dx / dist * Math.min(step, dist);
        em.y += dy / dist * Math.min(step, dist);
        if (Math.abs(dx) > 4) em.facing = dx < 0 ? -1 : 1;
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
      em.el.style.left = (em.x / VW * 100) + '%';
      em.el.style.top = (em.y / VH * 100) + '%';
      em.el.style.zIndex = 10 + Math.round(em.y / 4);
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

  function openPanel(em) {
    var e = em.def;
    panelEl.innerHTML =
      '<button type="button" class="office-panel__close" aria-label="閉じる">×</button>' +
      '<img class="office-panel__avatar" src="assets/avatars/' + encodeURIComponent(e.name) + '.svg" alt="' + esc(e.name) + 'のドット絵アバター">' +
      '<p class="office-panel__name dot">' + esc(e.name) + '</p>' +
      '<p class="office-panel__role">' + esc(e.role) + ' <span class="office-panel__dept" style="border-color:' + DEPT_COLOR[e.dept] + ';color:' + DEPT_COLOR[e.dept] + '">' + esc(e.dept) + '</span></p>' +
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
    em.el.addEventListener('click', function (ev) {
      if (view.moved) return;
      ev.stopPropagation();
      openPanel(em);
    });
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

  var DEFAULT_DASH = { level: 1, hp_percent: 0, exp_percent: 0, revenue_this_month: null, profit_this_month: null, activity: {} };
  var DEFAULT_OFFICES = {
    offices: [{ id: 'hq', name: '本店(最上階ペントハウス)', location: '神奈川県横浜市・みなとみらい タワーマンション最上階', unlocked_at_level: 1, scene: 'minatomirai-penthouse' }],
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
