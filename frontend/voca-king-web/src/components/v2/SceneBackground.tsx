/**
 * V2 배경 장면 컴포넌트
 * 숲/자연 테마 SVG 배경 - HTML 원본과 동일하게
 */
import { useEffect, useState } from 'react';

export default function SceneBackground() {
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth || 1200, h: window.innerHeight || 800 });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const W = Math.max(320, size.w);
  const H = Math.max(520, size.h);
  const gy = Math.round(H * 0.40);

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

  // 소나무 SVG (HTML 원본 스타일 - 여러 가지 레이어)
  const PineTree = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* 줄기 */}
      <rect x="-5" y="75" width="10" height="30" fill="#5D4037"/>
      {/* 나뭇잎 레이어들 - 아래에서 위로 */}
      <ellipse cx="0" cy="70" rx="32" ry="12" fill="#2E7D32"/>
      <ellipse cx="0" cy="55" rx="28" ry="11" fill="#388E3C"/>
      <ellipse cx="0" cy="42" rx="24" ry="10" fill="#43A047"/>
      <ellipse cx="0" cy="30" rx="20" ry="9" fill="#4CAF50"/>
      <ellipse cx="0" cy="20" rx="16" ry="8" fill="#66BB6A"/>
      <ellipse cx="0" cy="12" rx="12" ry="7" fill="#81C784"/>
      <ellipse cx="0" cy="5" rx="8" ry="5" fill="#A5D6A7"/>
      <ellipse cx="0" cy="0" rx="4" ry="3" fill="#C8E6C9"/>
    </g>
  );

  // 작은 소나무
  const SmallPine = ({ x, y, scale = 0.6 }: { x: number; y: number; scale?: number }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="-4" y="55" width="8" height="22" fill="#5D4037"/>
      <ellipse cx="0" cy="52" rx="24" ry="10" fill="#2E7D32"/>
      <ellipse cx="0" cy="40" rx="20" ry="9" fill="#388E3C"/>
      <ellipse cx="0" cy="30" rx="16" ry="8" fill="#43A047"/>
      <ellipse cx="0" cy="22" rx="12" ry="6" fill="#66BB6A"/>
      <ellipse cx="0" cy="15" rx="8" ry="5" fill="#81C784"/>
      <ellipse cx="0" cy="10" rx="5" ry="3" fill="#A5D6A7"/>
    </g>
  );

  // 둥근 나무
  const RoundTree = ({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <rect x="-6" y="30" width="12" height="35" fill="#6D4C41"/>
      <circle cx="0" cy="0" r="32" fill="#4CAF50"/>
      <circle cx="-12" cy="8" r="22" fill="#43A047"/>
      <circle cx="14" cy="4" r="20" fill="#66BB6A"/>
      <circle cx="0" cy="-10" r="18" fill="#81C784"/>
    </g>
  );

  const edge = Math.max(60, (W - 640) / 2);

  // 왼쪽 데코 배열
  const leftDecos = [
    { emoji: '🐿️', yOffset: -20, size: 28 },
    { emoji: '🌸', yOffset: 80, size: 22 },
    { emoji: '🍄', yOffset: 160, size: 24 },
    { emoji: '🌼', yOffset: 240, size: 20 },
    { emoji: '🐞', yOffset: 320, size: 22 },
  ];

  // 오른쪽 데코 배열
  const rightDecos = [
    { emoji: '🦋', yOffset: -30, size: 28 },
    { emoji: '☁️', yOffset: 40, size: 24 },
    { emoji: '🌻', yOffset: 120, size: 28 },
    { emoji: '🦋', yOffset: 200, size: 24 },
    { emoji: '🦔', yOffset: 280, size: 26 },
    { emoji: '🐞', yOffset: 350, size: 22 },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#87CEEB"/>
            <stop offset="1" stopColor="#E0F4FF"/>
          </linearGradient>
          <linearGradient id="grass-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8BD46A"/>
            <stop offset="1" stopColor="#5DAA3A"/>
          </linearGradient>
          <radialGradient id="sun-grad">
            <stop offset="0" stopColor="#FFFDE7"/>
            <stop offset="0.5" stopColor="#FFE066"/>
            <stop offset="1" stopColor="#FFE066" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* 하늘 */}
        <rect width={W} height={H} fill="url(#sky-grad)"/>

        {/* 태양 */}
        <circle cx={W * 0.12} cy={H * 0.1} r={60} fill="url(#sun-grad)"/>

        {/* 구름들 */}
        <g fill="#fff" opacity="0.92">
          <ellipse cx={W * 0.35} cy={H * 0.08} rx={40} ry={18}/>
          <ellipse cx={W * 0.35 - 22} cy={H * 0.08 + 3} rx={25} ry={14}/>
          <ellipse cx={W * 0.35 + 12} cy={H * 0.08 - 8} rx={28} ry={16}/>

          <ellipse cx={W * 0.88} cy={H * 0.06} rx={36} ry={16}/>
          <ellipse cx={W * 0.88 - 20} cy={H * 0.06 + 2} rx={22} ry={12}/>
          <ellipse cx={W * 0.88 + 15} cy={H * 0.06 - 6} rx={24} ry={14}/>

          <ellipse cx={W * 0.22} cy={H * 0.18} rx={32} ry={14}/>
          <ellipse cx={W * 0.22 + 18} cy={H * 0.18 - 5} rx={20} ry={12}/>
        </g>

        {/* 잔디 */}
        <path d={wave(gy - 10, 26)} fill="#8BD46A" opacity="0.7"/>
        <path d={wave(gy + 30, 18)} fill="url(#grass-grad)"/>

        {/* 작은 점들 (풀/꽃) */}
        {[...Array(20)].map((_, i) => (
          <circle
            key={`dot-${i}`}
            cx={30 + (i * (W - 60) / 20)}
            cy={gy + 70 + (i % 4) * 50 + (i % 3) * 30}
            r={2.5}
            fill={['#fff', '#ff9ec4', '#ffd43b'][i % 3]}
            opacity="0.75"
          />
        ))}

        {/* 왼쪽 나무들 */}
        <PineTree x={edge * 0.4} y={gy - 50} scale={0.9}/>
        <SmallPine x={edge * 0.7} y={gy + 20} scale={1}/>
        <PineTree x={edge * 0.25} y={gy + 150} scale={0.7}/>

        {/* 오른쪽 나무들 */}
        <RoundTree x={W - edge * 0.35} y={H - 80} scale={1}/>
        <PineTree x={W - edge * 0.6} y={gy + 30} scale={0.8}/>
        <SmallPine x={W - edge * 0.25} y={gy + 180} scale={0.9}/>

        {/* 왼쪽 데코레이션 */}
        {leftDecos.map((d, i) => (
          <text
            key={`left-${i}`}
            x={edge * (0.2 + (i % 2) * 0.4)}
            y={gy + d.yOffset}
            fontSize={d.size}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {d.emoji}
          </text>
        ))}

        {/* 오른쪽 데코레이션 */}
        {rightDecos.map((d, i) => (
          <text
            key={`right-${i}`}
            x={W - edge * (0.2 + (i % 2) * 0.4)}
            y={gy + d.yOffset}
            fontSize={d.size}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {d.emoji}
          </text>
        ))}
      </svg>
    </div>
  );
}
