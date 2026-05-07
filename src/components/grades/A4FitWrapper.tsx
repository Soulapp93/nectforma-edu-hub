import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';

const PX_PER_MM = 96 / 25.4;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PADDING_MM = 10;
const CONTENT_W_MM = PAGE_W_MM - PADDING_MM * 2; // 190
const CONTENT_H_MM = PAGE_H_MM - PADDING_MM * 2; // 277
const TARGET_H_PX = CONTENT_H_MM * PX_PER_MM;
const MIN_SCALE = 0.4;

interface Props {
  children: React.ReactNode;
  testId?: string;
  fontFamily?: string;
}

/**
 * Wrap any bulletin content into a fixed A4 portrait page.
 * If the content's natural height exceeds the available content area (277mm),
 * a `transform: scale(X)` is applied automatically so everything fits on a single page.
 *
 * The inner width is also widened by 1/scale so the visible content still fills the
 * A4 width after scaling — preserving a balanced look with no empty side margin.
 *
 * Trade-off: with `overflow: hidden`, extreme content (>~2x A4) is still clipped beyond
 * the MIN_SCALE floor (0.4 → about 11pt minimum). This is the safe limit before
 * legibility drops below printable quality.
 */
const A4FitWrapper: React.FC<Props> = ({ children, testId, fontFamily = 'Arial, Helvetica, sans-serif' }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measureAndScale = () => {
    const el = innerRef.current;
    if (!el) return;
    // Reset to natural width to measure unconstrained content height
    el.style.transform = 'none';
    el.style.width = `${CONTENT_W_MM}mm`;
    const h1 = el.scrollHeight;
    if (h1 <= TARGET_H_PX + 1) {
      setScale(1);
      return;
    }
    let s = TARGET_H_PX / h1;
    // Compensate width so the visible result still fills A4
    el.style.width = `${CONTENT_W_MM / s}mm`;
    const h2 = el.scrollHeight;
    if (h2 > TARGET_H_PX) s = TARGET_H_PX / h2;
    setScale(Math.max(MIN_SCALE, s));
  };

  useLayoutEffect(() => {
    measureAndScale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  // Re-run on resize / image load (logos may load asynchronously)
  useEffect(() => {
    if (!innerRef.current) return;
    const ro = new ResizeObserver(() => measureAndScale());
    ro.observe(innerRef.current);
    const onLoad = () => measureAndScale();
    const imgs = innerRef.current.querySelectorAll('img');
    imgs.forEach((img) => img.addEventListener('load', onLoad));
    return () => {
      ro.disconnect();
      imgs.forEach((img) => img.removeEventListener('load', onLoad));
    };
  }, [children]);

  const innerWidthMm = scale < 1 ? CONTENT_W_MM / scale : CONTENT_W_MM;

  return (
    <div
      style={{
        background: '#fff',
        color: '#000',
        fontFamily,
        width: `${PAGE_W_MM}mm`,
        height: `${PAGE_H_MM}mm`,
        padding: `${PADDING_MM}mm`,
        boxSizing: 'border-box',
        margin: '0 auto',
        overflow: 'hidden',
      }}
      data-testid={testId}
      data-a4-scale={scale.toFixed(3)}
    >
      <div
        ref={innerRef}
        style={{
          width: `${innerWidthMm}mm`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default A4FitWrapper;
