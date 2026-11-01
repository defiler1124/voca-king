/**
 * V2 배경 장면 컴포넌트
 * 숲/자연 테마 SVG 배경 - HTML 원본과 동일하게
 */
export default function SceneBackground() {
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
      <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="sun">
            <stop offset="0" stopColor="#fff7b0"/>
            <stop offset=".55" stopColor="#ffe066"/>
            <stop offset="1" stopColor="#ffe066" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cc8ff"/>
            <stop offset="0.6" stopColor="#a8dff8"/>
            <stop offset="1" stopColor="#7fd04a"/>
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="1000" height="700" fill="url(#sky)"/>

        {/* Sun - 왼쪽 상단 */}
        <circle cx="100" cy="80" r="70" fill="url(#sun)"/>

        {/* Clouds - 오른쪽 */}
        <g fill="#fff" opacity="0.95">
          <ellipse cx="920" cy="50" rx="35" ry="18"/>
          <ellipse cx="950" cy="45" rx="25" ry="14"/>
          <ellipse cx="895" cy="48" rx="28" ry="15"/>

          <ellipse cx="870" cy="140" rx="30" ry="16"/>
          <ellipse cx="900" cy="135" rx="22" ry="12"/>
        </g>

        {/* Ground - 연두색 잔디 */}
        <rect y="420" width="1000" height="280" fill="#7fd04a"/>

        {/* 언덕들 */}
        <ellipse cx="0" cy="440" rx="200" ry="80" fill="#6bc43a"/>
        <ellipse cx="500" cy="480" rx="300" ry="100" fill="#6bc43a"/>
        <ellipse cx="1000" cy="450" rx="250" ry="90" fill="#6bc43a"/>

        {/* 왼쪽 소나무 1 */}
        <g transform="translate(60, 250)">
          <rect x="12" y="80" width="8" height="40" fill="#5D4037"/>
          <polygon points="16,0 -5,90 37,90" fill="#1B5E20"/>
          <polygon points="16,25 0,80 32,80" fill="#2E7D32"/>
          <polygon points="16,45 5,70 27,70" fill="#388E3C"/>
        </g>

        {/* 왼쪽 소나무 2 */}
        <g transform="translate(130, 280)">
          <rect x="10" y="60" width="6" height="30" fill="#5D4037"/>
          <polygon points="13,0 -2,70 28,70" fill="#1B5E20"/>
          <polygon points="13,20 2,60 24,60" fill="#2E7D32"/>
        </g>

        {/* 다람쥐 - 왼쪽 */}
        <text x="35" y="320" style={{ fontSize: '28px' }}>🐿️</text>

        {/* 파란 나비 - 오른쪽 상단 */}
        <text x="920" y="220" style={{ fontSize: '32px' }}>🦋</text>

        {/* 파란 나비 - 오른쪽 중간 */}
        <text x="900" y="380" style={{ fontSize: '28px' }}>🦋</text>

        {/* 해바라기 - 오른쪽 */}
        <text x="870" cy="320" style={{ fontSize: '36px' }}>🌻</text>

        {/* 버섯 - 오른쪽 */}
        <text x="850" y="440" style={{ fontSize: '28px' }}>🍄</text>

        {/* 구름 모양 - 오른쪽 */}
        <text x="920" y="320" style={{ fontSize: '24px' }}>☁️</text>

        {/* 고슴도치 - 오른쪽 하단 */}
        <text x="870" y="540" style={{ fontSize: '28px' }}>🦔</text>

        {/* 무당벌레 - 오른쪽 하단 */}
        <text x="830" y="580" style={{ fontSize: '22px' }}>🐞</text>

        {/* 브로콜리/나무 - 오른쪽 */}
        <text x="890" y="480" style={{ fontSize: '26px' }}>🥦</text>

        {/* 작은 풀/점들 - 바닥 */}
        <g fill="#5cb82a">
          <circle cx="100" cy="520" r="3"/>
          <circle cx="200" cy="550" r="2"/>
          <circle cx="300" cy="530" r="3"/>
          <circle cx="400" cy="560" r="2"/>
          <circle cx="500" cy="540" r="3"/>
          <circle cx="600" cy="570" r="2"/>
          <circle cx="700" cy="525" r="3"/>
          <circle cx="150" cy="580" r="2"/>
          <circle cx="350" cy="590" r="3"/>
          <circle cx="550" cy="600" r="2"/>
          <circle cx="750" cy="560" r="2"/>
        </g>

        {/* 작은 꽃들 */}
        <text x="180" y="510" style={{ fontSize: '14px' }}>🌸</text>
        <text x="420" y="550" style={{ fontSize: '12px' }}>🌼</text>
        <text x="620" y="530" style={{ fontSize: '14px' }}>🌸</text>
        <text x="280" y="580" style={{ fontSize: '12px' }}>🌼</text>

        {/* 소나무 - 하단 왼쪽 */}
        <g transform="translate(180, 480)">
          <rect x="8" y="45" width="5" height="25" fill="#5D4037"/>
          <polygon points="10,0 0,50 20,50" fill="#1B5E20"/>
          <polygon points="10,15 3,42 17,42" fill="#2E7D32"/>
        </g>
      </svg>
    </div>
  );
}
