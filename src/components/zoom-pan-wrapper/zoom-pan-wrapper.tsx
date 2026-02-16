
import { useRef, useState, useEffect } from 'react';

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

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
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
    const nextScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 3);

    setScale(nextScale);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.3), 3));
      return;
    }

    setPosition((prev) => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    if (fitOnInit) {
      const timeout = setTimeout(() => {
        handleFitToScreen();
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
        <IconButton size="small" onClick={handleFitToScreen}>
          <Iconify icon="solar:maximize-square-2-linear" />
        </IconButton>
        <IconButton size="small" onClick={handleReset}>
          <Iconify icon="solar:restart-bold" />
        </IconButton>
      </Box>

      {/* Draggable Area */}
      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        sx={{
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
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
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
