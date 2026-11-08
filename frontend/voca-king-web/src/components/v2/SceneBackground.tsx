/**
 * V2 배경 장면 컴포넌트
 * Day/Level별 다른 테마의 SVG 배경 생성 (원본 HTML과 동일)
 */
import { useEffect, useState, useMemo } from 'react';
import { buildScene } from '../../utils/sceneBuilder';

interface Props {
  levelIndex?: number;
  dayIndex?: number;
}

export default function SceneBackground({ levelIndex = 0, dayIndex = 0 }: Props) {
  const [size, setSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth || 1200, h: window.innerHeight || 800 });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const svgContent = useMemo(() => {
    return buildScene(levelIndex, dayIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex, dayIndex, size.w, size.h]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
