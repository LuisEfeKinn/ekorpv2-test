
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
  fitOnInit?: boolean;
};

export function ZoomPanWrapper({ children, fitOnInit = false }: Props) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{ isPointerDown: boolean; pointerId: number | null }>({
    isPointerDown: false,
    pointerId: null,
  });
  const previousBodyUserSelectRef = useRef<string | null>(null);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFitToScreen = (options?: { allowUpscale?: boolean }) => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const contentWidth = content.scrollWidth;
    const contentHeight = content.scrollHeight;

    if (contentWidth === 0 || contentHeight === 0) return;

    const paddingFactor = 0.92;
    const scaleX = (containerWidth / contentWidth) * paddingFactor;
    const scaleY = (containerHeight / contentHeight) * paddingFactor;
    const fitScale = Math.min(scaleX, scaleY);
    const maxScale = options?.allowUpscale === false ? 1 : 3;
    const nextScale = Math.max(Math.min(fitScale, maxScale), 0.3);

    setScale(nextScale);
    setPosition({ x: 0, y: 0 });
  };

  const restoreBodyUserSelect = useCallback(() => {
    if (previousBodyUserSelectRef.current === null) return;
    document.body.style.userSelect = previousBodyUserSelectRef.current;
    previousBodyUserSelectRef.current = null;
  }, []);

  const disableBodyUserSelect = useCallback(() => {
    if (previousBodyUserSelectRef.current === null) {
      previousBodyUserSelectRef.current = document.body.style.userSelect;
    }
    document.body.style.userSelect = 'none';
  }, []);

  const endDrag = useCallback(() => {
    dragStateRef.current.isPointerDown = false;
    dragStateRef.current.pointerId = null;
    setIsDragging(false);
    restoreBodyUserSelect();
  }, [restoreBodyUserSelect]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      if (
        e.target instanceof HTMLElement &&
        e.target.closest('button, a, input, textarea, select, [role="button"]')
      ) {
        return;
      }

      dragStateRef.current.isPointerDown = true;
      dragStateRef.current.pointerId = e.pointerId;

      disableBodyUserSelect();
      e.currentTarget.setPointerCapture(e.pointerId);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [disableBodyUserSelect, position.x, position.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current.isPointerDown) return;

      if (!isDragging) {
        setIsDragging(true);
      }

      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    },
    [isDragging, startPos.x, startPos.y]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent<HTMLDivElement>) => {
      endDrag();
    },
    [endDrag]
  );

  useEffect(() => {
    const handleGlobalPointerUp = () => endDrag();
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [endDrag]);

  const handleNativeWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.3), 3));
      return;
    }

    setPosition((prev) => ({
      x: prev.x - event.deltaX,
      y: prev.y - event.deltaY,
    }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, [handleNativeWheel]);

  useEffect(() => {
    if (fitOnInit) {
      const timeout = setTimeout(() => {
        handleFitToScreen({ allowUpscale: false });
      }, 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [fitOnInit]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        bgcolor: 'background.neutral',
        borderRadius: 1,
        border: `1px dashed ${theme.vars.palette.divider}`,
      }}
    >
      {/* Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 9,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'background.paper',
          p: 0.5,
          borderRadius: 1,
          boxShadow: theme.customShadows.z8,
        }}
      >
        <IconButton size="small" onClick={handleZoomIn}>
          <Iconify icon="eva:plus-fill" />
        </IconButton>
        <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          {Math.round(scale * 100)}%
        </Typography>
        <IconButton size="small" onClick={handleZoomOut}>
          <Iconify icon="eva:minus-fill" />
        </IconButton>
        <IconButton size="small" onClick={() => handleFitToScreen()}>
          <Iconify icon="solar:maximize-square-2-linear" />
        </IconButton>
        <IconButton size="small" onClick={handleReset}>
          <Iconify icon="solar:restart-bold" />
        </IconButton>
      </Box>

      {/* Draggable Area */}
      <Box
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        sx={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Transformable Content */}
        <Box
          ref={contentRef}
          sx={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            display: 'flex',
            justifyContent: 'center',
            userSelect: 'none',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
