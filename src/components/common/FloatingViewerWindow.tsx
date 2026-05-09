import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface FloatingViewerWindowProps {
  open: boolean;
  onClose: () => void;
  /** Header rendered above the body. Receives a `dragHandleProps` to attach to the drag area. */
  renderHeader: (api: {
    dragHandleProps: {
      onMouseDown: (e: React.MouseEvent) => void;
      onTouchStart: (e: React.TouchEvent) => void;
      onDoubleClick: () => void;
      style: React.CSSProperties;
    };
    isMaximized: boolean;
    toggleMaximize: () => void;
  }) => React.ReactNode;
  children: React.ReactNode;
  /** Default width on first open (desktop). Default 1100. */
  defaultWidth?: number;
  /** Default height on first open (desktop). Default 0.9 * viewport height. */
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  /** Test id for the outer window. */
  testId?: string;
}

const MOBILE_BREAKPOINT = 640;

/**
 * Floating window with:
 * - Drag the title bar to move
 * - Resize from all 4 borders + 4 corners
 * - Maximize / restore (also via header double-click)
 * - Esc to close
 * - Backdrop blur, viewport-bounded
 *
 * On mobile (<640px), behaves like a full-screen modal (no drag, no resize),
 * since touch UX for resize handles is not great on small screens.
 */
const FloatingViewerWindow: React.FC<FloatingViewerWindowProps> = ({
  open,
  onClose,
  renderHeader,
  children,
  defaultWidth = 1100,
  defaultHeight,
  minWidth = 480,
  minHeight = 320,
  testId,
}) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const computeDefault = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(defaultWidth, vw - 40);
    const h = Math.min(defaultHeight ?? Math.round(vh * 0.9), vh - 40);
    return {
      x: Math.max(20, Math.round((vw - w) / 2)),
      y: Math.max(20, Math.round((vh - h) / 2)),
      w,
      h,
    };
  }, [defaultWidth, defaultHeight]);

  const [rect, setRect] = useState(() => ({ x: 0, y: 0, w: defaultWidth, h: defaultHeight ?? 800 }));
  const [isMaximized, setIsMaximized] = useState(false);
  const preMaximizeRect = useRef(rect);

  // Initialise position when the window opens
  useEffect(() => {
    if (open && !isMobile) {
      const d = computeDefault();
      setRect(d);
      preMaximizeRect.current = d;
      setIsMaximized(false);
    }
  }, [open, isMobile, computeDefault]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Clamp to viewport on resize
  useEffect(() => {
    const onResize = () => {
      if (isMaximized) return;
      setRect(r => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = Math.min(r.w, vw - 20);
        const h = Math.min(r.h, vh - 20);
        const x = Math.min(r.x, Math.max(0, vw - w));
        const y = Math.min(r.y, Math.max(0, vh - h));
        return { x, y, w, h };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isMaximized]);

  // ─── Drag (move) ─────────────────────────────────────────
  const dragRef = useRef<{ startX: number; startY: number; rect: typeof rect } | null>(null);

  const onDragStart = (clientX: number, clientY: number) => {
    if (isMaximized || isMobile) return;
    dragRef.current = { startX: clientX, startY: clientY, rect: { ...rect } };
    document.body.style.userSelect = 'none';
  };
  const onDragMove = useCallback((clientX: number, clientY: number) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = clientX - d.startX;
    const dy = clientY - d.startY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const newX = Math.max(0, Math.min(vw - d.rect.w, d.rect.x + dx));
    const newY = Math.max(0, Math.min(vh - 40, d.rect.y + dy));
    setRect(r => ({ ...r, x: newX, y: newY }));
  }, []);
  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    document.body.style.userSelect = '';
  }, []);

  // ─── Resize ──────────────────────────────────────────────
  type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  const resizeRef = useRef<{ edge: Edge; startX: number; startY: number; rect: typeof rect } | null>(null);

  const onResizeStart = (edge: Edge, clientX: number, clientY: number) => {
    if (isMaximized || isMobile) return;
    resizeRef.current = { edge, startX: clientX, startY: clientY, rect: { ...rect } };
    document.body.style.userSelect = 'none';
  };
  const onResizeMove = useCallback((clientX: number, clientY: number) => {
    const r = resizeRef.current;
    if (!r) return;
    const dx = clientX - r.startX;
    const dy = clientY - r.startY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { x, y, w, h } = r.rect;

    if (r.edge.includes('e')) w = Math.max(minWidth, Math.min(vw - x, r.rect.w + dx));
    if (r.edge.includes('s')) h = Math.max(minHeight, Math.min(vh - y, r.rect.h + dy));
    if (r.edge.includes('w')) {
      const newW = Math.max(minWidth, r.rect.w - dx);
      x = r.rect.x + (r.rect.w - newW);
      x = Math.max(0, x);
      w = newW;
    }
    if (r.edge.includes('n')) {
      const newH = Math.max(minHeight, r.rect.h - dy);
      y = r.rect.y + (r.rect.h - newH);
      y = Math.max(0, y);
      h = newH;
    }
    setRect({ x, y, w, h });
  }, [minWidth, minHeight]);
  const onResizeEnd = useCallback(() => {
    resizeRef.current = null;
    document.body.style.userSelect = '';
  }, []);

  // Global mouse listeners (work even when cursor goes off-handle)
  useEffect(() => {
    if (!open) return;
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) onDragMove(e.clientX, e.clientY);
      if (resizeRef.current) onResizeMove(e.clientX, e.clientY);
    };
    const onUp = () => {
      onDragEnd();
      onResizeEnd();
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (dragRef.current) onDragMove(t.clientX, t.clientY);
      if (resizeRef.current) onResizeMove(t.clientX, t.clientY);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [open, onDragMove, onDragEnd, onResizeMove, onResizeEnd]);

  // ─── Maximize ────────────────────────────────────────────
  const toggleMaximize = useCallback(() => {
    if (isMobile) return;
    setIsMaximized(prev => {
      if (prev) {
        setRect(preMaximizeRect.current);
        return false;
      }
      preMaximizeRect.current = rect;
      setRect({ x: 0, y: 0, w: window.innerWidth, h: window.innerHeight });
      return true;
    });
  }, [rect, isMobile]);

  if (!open) return null;

  // Mobile: simple full-screen overlay (no drag, no resize)
  if (isMobile) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] bg-background flex flex-col"
        data-testid={testId}
      >
        {renderHeader({
          dragHandleProps: {
            onMouseDown: () => {},
            onTouchStart: () => {},
            onDoubleClick: () => {},
            style: {},
          },
          isMaximized: true,
          toggleMaximize: () => {},
        })}
        <div className="flex-1 relative bg-muted/30 overflow-hidden">{children}</div>
      </div>,
      document.body
    );
  }

  const dragHandleProps = {
    onMouseDown: (e: React.MouseEvent) => {
      // Don't initiate a drag if the user clicked on a button inside the header
      if ((e.target as HTMLElement).closest('button, a, input, [data-no-drag]')) return;
      onDragStart(e.clientX, e.clientY);
    },
    onTouchStart: (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest('button, a, input, [data-no-drag]')) return;
      const t = e.touches[0];
      if (t) onDragStart(t.clientX, t.clientY);
    },
    onDoubleClick: toggleMaximize,
    style: { cursor: isMaximized ? 'default' : 'move' } as React.CSSProperties,
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        data-testid="floating-window-backdrop"
      />

      {/* Window */}
      <div
        className="fixed z-[100] bg-background border border-primary/20 shadow-2xl rounded-2xl flex flex-col overflow-hidden select-none"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
        }}
        data-testid={testId}
      >
        {/* Header (with drag handle) */}
        {renderHeader({ dragHandleProps, isMaximized, toggleMaximize })}

        {/* Body */}
        <div className="flex-1 relative bg-muted/30 overflow-hidden">{children}</div>

        {/* Resize handles (8: 4 sides + 4 corners) */}
        {!isMaximized && (
          <>
            <ResizeHandle position="n" onStart={onResizeStart} />
            <ResizeHandle position="s" onStart={onResizeStart} />
            <ResizeHandle position="e" onStart={onResizeStart} />
            <ResizeHandle position="w" onStart={onResizeStart} />
            <ResizeHandle position="ne" onStart={onResizeStart} />
            <ResizeHandle position="nw" onStart={onResizeStart} />
            <ResizeHandle position="se" onStart={onResizeStart} />
            <ResizeHandle position="sw" onStart={onResizeStart} />
          </>
        )}
      </div>
    </>,
    document.body
  );
};

const handleStyles: Record<string, React.CSSProperties> = {
  n: { top: 0, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
  s: { bottom: 0, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
  e: { right: 0, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
  w: { left: 0, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
  ne: { top: 0, right: 0, width: 14, height: 14, cursor: 'nesw-resize' },
  nw: { top: 0, left: 0, width: 14, height: 14, cursor: 'nwse-resize' },
  se: { bottom: 0, right: 0, width: 14, height: 14, cursor: 'nwse-resize' },
  sw: { bottom: 0, left: 0, width: 14, height: 14, cursor: 'nesw-resize' },
};

const ResizeHandle: React.FC<{
  position: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  onStart: (edge: any, x: number, y: number) => void;
}> = ({ position, onStart }) => (
  <div
    className="absolute z-10"
    style={{ position: 'absolute', ...handleStyles[position] }}
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onStart(position, e.clientX, e.clientY);
    }}
    onTouchStart={(e) => {
      e.stopPropagation();
      const t = e.touches[0];
      if (t) onStart(position, t.clientX, t.clientY);
    }}
    data-testid={`resize-handle-${position}`}
  />
);

export default FloatingViewerWindow;
