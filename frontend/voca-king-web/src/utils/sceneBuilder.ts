/**
 * 배경 테마 시스템 - 원본 HTML에서 추출
 * Day/Level별 다른 배경 이미지 생성
 */

interface Theme {
  n: string;
  ic: string;
  sky: [string, string];
  g: [string, string];
  gt: string;
  hs: string;
  hero: string;
  top: string[];
  deco: string[];
  night?: boolean;
  fixed?: boolean;
  whale?: boolean;
  island?: boolean;
}

const THEMES: Record<string, Theme> = {
  forest: { n: '숲속 마을', ic: '🌳', sky: ['#bfeaff', '#eafaff'], g: ['#9be05c', '#6cc53f'], gt: 'hills', hs: '#2b7a1f', hero: '🌳', top: ['🐦', '🦋', '☁️'], deco: ['🌲', '🍄', '🐿️', '🦋', '🌼', '🦔', '🐞', '🌳', '🐇'] },
  sea: { n: '바다', ic: '🌊', sky: ['#7fd3ff', '#d3f3ff'], g: ['#35aef0', '#136fc4'], gt: 'sea', hs: '#0d4f94', hero: '🐳', top: ['⛵', '🕊️', '☁️'], deco: ['🐠', '🐟', '🐙', '🦀', '🐚', '🐬', '🪸', '🐡', '🦑', '🐢'] },
  space: { n: '우주', ic: '🚀', sky: ['#0b1440', '#2c1b63'], g: ['#7a6cd1', '#3b2f86'], gt: 'planet', hs: '#120a3a', hero: '🪐', top: ['🌙', '☄️', '🛰️'], deco: ['🚀', '🛸', '⭐', '🌍', '👾', '🛰️', '✨', '🌟', '👩‍🚀'], night: true },
  river: { n: '강가', ic: '🛶', sky: ['#aee3ff', '#ecfaff'], g: ['#93d85c', '#5fb83a'], gt: 'river', hs: '#22742e', hero: '🌉', top: ['🐦', '☁️', '🦅'], deco: ['🦆', '🐟', '🛶', '🐸', '🌾', '🪷', '🦢', '🐢', '🎣'] },
  zoo: { n: '동물원', ic: '🦁', sky: ['#bff0ff', '#fff4d4'], g: ['#ecd67f', '#cfae4f'], gt: 'hills', hs: '#8a5a00', hero: '🦒', top: ['🎈', '☁️', '🦜'], deco: ['🦁', '🐘', '🐒', '🦓', '🐼', '🦛', '🐧', '🌴', '🐊', '🦘'] },
  school: { n: '학교', ic: '🏫', sky: ['#c6ecff', '#f2fbff'], g: ['#86d36a', '#55b04a'], gt: 'field', hs: '#1f6b8f', hero: '🏫', top: ['✈️', '☁️', '🔔'], deco: ['📚', '✏️', '🎒', '⚽', '📐', '🖍️', '🏀', '🧮', '📏', '🎨'] },
  sky: { n: '하늘', ic: '🎈', sky: ['#7cc8ff', '#ffe1f0'], g: ['#ffffff', '#e8f4ff'], gt: 'clouds', hs: '#2a63b5', hero: '🎈', top: ['🌈', '🕊️', '✈️'], deco: ['🎈', '🪁', '🕊️', '☁️', '🦅', '🎐', '🪂', '🌈', '🐝'] },
  farm: { n: '농장', ic: '🚜', sky: ['#bdeaff', '#fff7dd'], g: ['#a5dc63', '#78bf3e'], gt: 'hills', hs: '#5a7a12', hero: '🚜', top: ['☀️', '🐦', '☁️'], deco: ['🐄', '🐔', '🐑', '🐷', '🌻', '🌽', '🐴', '🥕', '🐣', '🐐'] },
  city: { n: '도시', ic: '🏙️', sky: ['#a9dcff', '#fff0d6'], g: ['#8fd06a', '#62b14a'], gt: 'city', hs: '#2a3f7a', hero: '🎡', top: ['✈️', '🚁', '☁️'], deco: ['🚌', '🚕', '🌳', '🚲', '🚦', '🛴', '🚓', '🏪', '🐕'] },
  snow: { n: '눈 나라', ic: '⛄', sky: ['#cfe8ff', '#f5fbff'], g: ['#ffffff', '#e1eefc'], gt: 'snow', hs: '#2c5f9e', hero: '⛄', top: ['❄️', '☁️', '🦅'], deco: ['🌲', '❄️', '🐧', '🎿', '🦌', '🛷', '🐻‍❄️', '⛷️', '🧤'] },
  camp: { n: '캠핑장', ic: '⛺', sky: ['#ffd9a8', '#fff3d6'], g: ['#7cc35a', '#4f9b3f'], gt: 'hills', hs: '#6b3d12', hero: '⛺', top: ['🦉', '☁️', '🌙'], deco: ['🔥', '🌲', '🦉', '🍢', '🔦', '🦊', '🐿️', '🎒', '🍄'] },
  castle: { n: '왕국', ic: '🏰', sky: ['#d7c8ff', '#fff0f7'], g: ['#a6e36b', '#73c447'], gt: 'hills', hs: '#5b2b8f', hero: '🏰', top: ['🐉', '☁️', '🌈'], deco: ['👑', '🦄', '🛡️', '🎠', '💎', '🗝️', '🐴', '🌹', '🧚'] },
  park: { n: '공원', ic: '🌳', sky: ['#b5e6ff', '#f0fbff'], g: ['#9ee06a', '#6cc04a'], gt: 'park', hs: '#2b7a1f', hero: '⛲', top: ['🪁', '🐦', '☁️'], deco: ['🌳', '🐕', '🚲', '🦆', '🌷', '🛝', '🧺', '🐿️', '🌼', '🛹'] },
  amuse: { n: '놀이공원', ic: '🎡', sky: ['#c4b5ff', '#ffe8f3'], g: ['#9fe07a', '#6bc155'], gt: 'amuse', hs: '#7a2d8f', hero: '🎡', top: ['🎈', '🎈', '☁️'], deco: ['🎢', '🎠', '🎪', '🎈', '🍿', '🎟️', '🍭', '🤡', '🧸'] },
  mall: { n: '백화점', ic: '🛍️', sky: ['#fff4e8', '#ffe3ef'], g: ['#f4ede4', '#e6d9ca'], gt: 'mall', hs: '#a23b72', hero: '🛍️', top: ['💡', '✨', '🎀'], deco: ['🛍️', '👗', '👟', '🧸', '🎁', '👜', '🛒', '🍦', '🕶️', '⌚'], fixed: true },
  library: { n: '도서관', ic: '📚', sky: ['#f6ecd6', '#efe0c0'], g: ['#c99a63', '#a8784a'], gt: 'library', hs: '#6b4320', hero: '📚', top: ['💡', '🌍', '🕰️'], deco: ['📚', '📖', '🔍', '🖋️', '📕', '📗', '📘', '🪑', '🧑‍🎓'], fixed: true },
  beach: { n: '해변', ic: '🏖️', sky: ['#8fd8ff', '#e0f7ff'], g: ['#f7e2a8', '#ecca7c'], gt: 'beach', hs: '#0d6aa8', hero: '⛱️', top: ['☀️', '⛵', '🕊️'], deco: ['🐚', '🦀', '🏄', '🍉', '🩴', '🏐', '🪣', '🌴', '🐢'] },
  whale: { n: '고래 바다', ic: '🐋', sky: ['#86cfff', '#dff4ff'], g: ['#2a8fd6', '#0d4c94'], gt: 'ocean', hs: '#0b3f7a', hero: '🐋', top: ['⛵', '🕊️', '☁️'], deco: ['🐳', '🐋', '🌊', '🐟', '🐠', '🦭', '🐧', '⛵'], whale: true },
  dolphin: { n: '돌고래 바다', ic: '🐬', sky: ['#9be3ff', '#eafaff'], g: ['#30c2d9', '#127aa8'], gt: 'ocean', hs: '#0a5d7a', hero: '🐬', top: ['☁️', '🕊️', '🌈'], deco: ['🐬', '🐬', '🌊', '🐠', '🏝️', '🐡', '🛥️', '🐚'], island: true },
  reef: { n: '산호초', ic: '🪸', sky: ['#3fd0ea', '#0a4e8c'], g: ['#e9d7a5', '#d6bd7f'], gt: 'reef', hs: '#06406e', hero: '🐢', top: ['🐠', '🐟', '🫧'], deco: ['🐠', '🐡', '🐟', '🦈', '🪸', '🦑', '🐙', '🦀', '🐚', '🐢'], fixed: true }
};

const LEVEL_PLACES: string[][] = [
  ['forest', 'beach', 'zoo', 'park', 'library', 'farm', 'dolphin', 'amuse'],
  ['zoo', 'mall', 'school', 'reef', 'park', 'sky', 'beach', 'whale'],
  ['park', 'river', 'library', 'dolphin', 'city', 'farm', 'amuse', 'sea'],
  ['school', 'mall', 'whale', 'zoo', 'snow', 'reef', 'beach', 'park'],
  ['beach', 'library', 'camp', 'park', 'reef', 'zoo', 'sky', 'mall'],
  ['amuse', 'reef', 'castle', 'school', 'mall', 'forest', 'whale', 'library'],
  ['dolphin', 'space', 'park', 'zoo', 'city', 'beach', 'snow', 'library'],
  ['whale', 'library', 'amuse', 'castle', 'reef', 'river', 'mall', 'park'],
  ['reef', 'castle', 'mall', 'park', 'sea', 'zoo', 'library', 'dolphin', 'camp'],
  ['beach', 'library', 'space', 'city', 'dolphin', 'forest', 'amuse', 'whale', 'zoo'],
  ['whale', 'school', 'park', 'amuse', 'reef', 'snow', 'mall', 'camp', 'beach'],
  ['space', 'library', 'beach', 'reef', 'castle', 'mall', 'zoo', 'park', 'dolphin', 'whale']
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function getSceneInfo(levelIndex: number, dayIndex: number) {
  const li = levelIndex % LEVEL_PLACES.length;
  const P = LEVEL_PLACES[li];
  const key = P[dayIndex % P.length];
  const T = THEMES[key];
  return { key, theme: T };
}

export function buildScene(levelIndex: number, dayIndex: number): string {
  const W = Math.max(320, window.innerWidth || 400);
  const H = Math.max(520, window.innerHeight || 800);
  const R = rng(levelIndex * 997 + dayIndex * 131 + 7);

  const { theme: T } = getSceneInfo(levelIndex, dayIndex);
  const night = T.night;
  const sky = T.sky;
  const gy = Math.round(H * 0.40);
  const ri = (a: number, b: number) => a + R() * (b - a);

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">` +
    `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>` +
    `<linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.g[0]}"/><stop offset="1" stop-color="${T.g[1]}"/></linearGradient>` +
    `<radialGradient id="sun"><stop offset="0" stop-color="#fff7b0"/><stop offset=".55" stop-color="#ffe066"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#sk)"/>`;

  // Sun or stars
  if (T.fixed) {
    // no sun/stars for fixed themes
  } else if (night) {
    for (let i = 0; i < 70; i++) {
      s += `<circle cx="${ri(0, W)}" cy="${ri(0, T.gt === 'planet' ? H : gy)}" r="${ri(0.6, 2)}" fill="#fff" opacity="${ri(0.4, 1)}"/>`;
    }
    if (T.gt !== 'planet') {
      s += `<circle cx="${W * 0.82}" cy="${H * 0.09}" r="26" fill="#fff6c9"/><circle cx="${W * 0.82 + 11}" cy="${H * 0.09 - 6}" r="22" fill="${sky[0]}"/>`;
    }
  } else if (T.gt !== 'clouds') {
    const sx = R() < 0.5 ? W * 0.14 : W * 0.86;
    s += `<circle cx="${sx}" cy="${H * 0.1}" r="55" fill="url(#sun)"/>`;
  }

  // Clouds
  if (!T.fixed && T.gt !== 'planet' && !night) {
    for (let i = 0; i < 4; i++) {
      const cx = ri(0, W);
      const cy = ri(H * 0.03, gy - 60);
      const k = ri(0.7, 1.3);
      s += `<g opacity="0.9" fill="#fff"><ellipse cx="${cx}" cy="${cy}" rx="${34 * k}" ry="${14 * k}"/><ellipse cx="${cx - 18 * k}" cy="${cy + 2}" rx="${20 * k}" ry="${12 * k}"/><ellipse cx="${cx + 8 * k}" cy="${cy - 10 * k}" rx="${20 * k}" ry="${15 * k}"/></g>`;
    }
  }

  // Ground - simplified version
  const wave = (y: number, amp: number) => {
    let d = `M0 ${y}`;
    const n = 4;
    for (let i = 0; i < n; i++) {
      const x1 = W * (i + 0.5) / n;
      const x2 = W * (i + 1) / n;
      d += ` Q${x1} ${y + (i % 2 ? amp : -amp)} ${x2} ${y}`;
    }
    return d + ` L${W} ${H} L0 ${H} Z`;
  };

  switch (T.gt) {
    case 'sea':
      s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="url(#gr)"/>`;
      for (let i = 0; i < 3; i++) s += `<path d="${wave(gy + i * 16, 6)}" fill="#fff" opacity="${0.18 - i * 0.05}"/>`;
      s += `<path d="${wave(H * 0.9, 14)}" fill="#f6dfa4"/>`;
      break;
    case 'beach':
      s += `<rect x="0" y="${gy - 40}" width="${W}" height="${H - gy + 40}" fill="#3fb6ec"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="${wave(gy - 30 + i * 14, 5)}" fill="#fff" opacity="${0.16 - i * 0.03}"/>`;
      s += `<path d="${wave(gy + 40, 16)}" fill="#fff" opacity=".85"/><path d="${wave(gy + 48, 16)}" fill="url(#gr)"/>`;
      break;
    case 'ocean':
      s += `<rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="url(#gr)"/>`;
      for (let y = gy + 10; y < H; y += 46) {
        for (let x = -20; x < W; x += 90) {
          const ox = x + ((y / 46) % 2) * 45;
          s += `<path d="M${ox} ${y} q15 -10 30 0 t30 0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".28" stroke-linecap="round"/>`;
        }
      }
      break;
    case 'snow':
      s += `<path d="${wave(gy - 20, 30)}" fill="#e1eefc"/><path d="${wave(gy + 30, 20)}" fill="#fff"/>`;
      for (let i = 0; i < 60; i++) s += `<circle cx="${ri(0, W)}" cy="${ri(0, H)}" r="${ri(1, 3)}" fill="#fff" opacity=".9"/>`;
      break;
    case 'mall': {
      // 백화점 - 상점 건물들 + 타일 바닥
      const top = H * 0.1;
      const PC = ['#ffd1dc', '#cfe8ff', '#d9f7d0', '#fff0b8', '#e7d6ff'];
      let x = -20, i = 0;
      while (x < W) {
        const w = ri(110, 150);
        const c = PC[i % PC.length];
        s += `<rect x="${x}" y="${top}" width="${w - 8}" height="${gy - top + 30}" fill="${c}" stroke="#fff" stroke-width="4"/>`;
        s += `<rect x="${x + 12}" y="${top + 46}" width="${w - 32}" height="${gy - top - 40}" fill="#ffffff" opacity=".6"/>`;
        for (let k2 = 0; k2 < 6; k2++) {
          s += `<rect x="${x + k2 * (w - 8) / 6}" y="${top}" width="${(w - 8) / 6}" height="26" fill="${k2 % 2 ? '#ffffff' : ['#ff6b8a', '#4da3ff', '#3cc98a', '#ff9f1a', '#a05cf0'][i % 5]}"/>`;
        }
        x += w;
        i++;
      }
      s += `<rect x="0" y="${gy + 30}" width="${W}" height="${H - gy}" fill="url(#gr)"/>`;
      // 타일 바닥 패턴
      for (let y = gy + 70; y < H; y += 50) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#d4c3ae" stroke-width="2"/>`;
      for (let x2 = 0; x2 < W; x2 += 70) s += `<line x1="${x2}" y1="${gy + 30}" x2="${x2 + (x2 - W / 2) * 0.4}" y2="${H}" stroke="#d4c3ae" stroke-width="2"/>`;
      break;
    }
    case 'library': {
      // 도서관 - 책장들 + 나무 바닥
      const BC = ['#d9534f', '#4da3ff', '#3cc98a', '#f0ad4e', '#8a6cff', '#e67e22', '#16a085', '#c0392b'];
      for (let x = 10; x < W; x += 130) {
        const sw = 118, top = H * 0.06, bot = gy + 40;
        s += `<rect x="${x}" y="${top}" width="${sw}" height="${bot - top}" fill="#8a5a2b" rx="4"/>`;
        const rows = 4, rh = (bot - top - 16) / rows;
        for (let rr = 0; rr < rows; rr++) {
          const ry = top + 8 + rr * rh;
          s += `<rect x="${x + 6}" y="${ry}" width="${sw - 12}" height="${rh - 8}" fill="#5e3b1c"/>`;
          let bx = x + 8;
          while (bx < x + sw - 14) {
            const bw = ri(7, 13), bh = ri(rh * 0.55, rh - 12);
            s += `<rect x="${bx}" y="${ry + rh - 8 - bh}" width="${bw}" height="${bh}" fill="${BC[Math.floor(R() * BC.length)]}" rx="1.5"/>`;
            bx += bw + 1.5;
          }
        }
      }
      s += `<rect x="0" y="${gy + 40}" width="${W}" height="${H - gy}" fill="url(#gr)"/>`;
      // 나무 바닥 줄
      for (let y = gy + 70; y < H; y += 34) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#8f6237" stroke-width="2" opacity=".6"/>`;
      // 타원형 카펫
      s += `<ellipse cx="${W * 0.5}" cy="${H * 0.82}" rx="${W * 0.42}" ry="${H * 0.08}" fill="#c0392b" opacity=".35"/>`;
      break;
    }
    case 'amuse': {
      // 놀이공원 - 관람차 + 롤러코스터
      s += `<path d="${wave(gy - 10, 22)}" fill="${T.g[0]}" opacity=".7"/><path d="${wave(gy + 30, 16)}" fill="url(#gr)"/>`;
      // 관람차
      const fx = W * 0.2, fy = gy - 60, fr = 90;
      s += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="none" stroke="#ff6b8a" stroke-width="6"/>`;
      for (let a = 0; a < 12; a++) {
        const an = a * Math.PI / 6;
        const cx = fx + fr * Math.cos(an), cy = fy + fr * Math.sin(an);
        s += `<line x1="${fx}" y1="${fy}" x2="${cx}" y2="${cy}" stroke="#ffb3c4" stroke-width="2"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="9" fill="${['#ffd43b', '#4da3ff', '#3cc98a', '#a05cf0'][a % 4]}"/>`;
      }
      s += `<line x1="${fx}" y1="${fy}" x2="${fx - 50}" y2="${gy + 40}" stroke="#888" stroke-width="5"/>`;
      s += `<line x1="${fx}" y1="${fy}" x2="${fx + 50}" y2="${gy + 40}" stroke="#888" stroke-width="5"/>`;
      // 롤러코스터 트랙
      let d = `M${W * 0.45} ${gy + 10}`;
      for (let x = W * 0.45; x < W + 40; x += 60) d += ` Q${x + 30} ${gy - ri(40, 110)} ${x + 60} ${gy + 10}`;
      s += `<path d="${d}" fill="none" stroke="#ff4d4d" stroke-width="6"/>`;
      for (let x = W * 0.47; x < W; x += 30) s += `<line x1="${x}" y1="${gy + 10}" x2="${x}" y2="${gy + 40}" stroke="#c94a4a" stroke-width="2"/>`;
      // 바닥 점들
      for (let i = 0; i < 20; i++) s += `<circle cx="${ri(0, W)}" cy="${ri(gy + 60, H)}" r="3" fill="${['#ff6b8a', '#ffd43b', '#4da3ff'][i % 3]}" opacity=".8"/>`;
      break;
    }
    default:
      s += `<path d="${wave(gy - 10, 26)}" fill="${T.g[0]}" opacity=".7"/><path d="${wave(gy + 30, 18)}" fill="url(#gr)"/>`;
      for (let i = 0; i < 26; i++) s += `<circle cx="${ri(0, W)}" cy="${ri(gy + 50, H)}" r="2.6" fill="${['#fff', '#ff9ec4', '#ffd43b'][i % 3]}" opacity=".8"/>`;
  }

  // Emoji decorations
  const emo = (e: string, x: number, y: number, sz: number, rot: number, op: number) =>
    `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" font-size="${sz.toFixed(0)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rot.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})" opacity="${op}">${e}</text>`;

  const edge = Math.max(30, (W - 640) / 2 - 10);

  // Top decorations
  for (let i = 0; i < 3; i++) {
    s += emo(T.top[i % T.top.length], ri(W * 0.05, W * 0.95), ri(H * 0.04, gy - 30), ri(22, 32), ri(-10, 10), 0.95);
  }

  // Side decorations
  const deco = T.deco.map(x => [R(), x] as [number, string]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  let k = 0;
  for (let y = gy + 40; y < H - 10; y += ri(58, 84)) {
    s += emo(deco[k++ % deco.length], R() < 0.5 ? ri(8, edge) : W - ri(8, edge), y, ri(28, 40), ri(-12, 12), 0.95);
    if (W > 700 || R() < 0.35) {
      s += emo(deco[k++ % deco.length], R() < 0.5 ? ri(8, edge) : W - ri(8, edge), y + ri(-20, 20), ri(26, 36), ri(-12, 12), 0.95);
    }
  }

  // Hero emoji
  s += emo(T.hero, W - Math.min(56, edge + 20), H - 70, 86, 0, 1);

  return s + '</svg>';
}

export function getSceneDataUrl(levelIndex: number, dayIndex: number): string {
  const svg = buildScene(levelIndex, dayIndex);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
