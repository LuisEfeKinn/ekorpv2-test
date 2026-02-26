import { type Node } from '@xyflow/react';
import { useRef, useState, useEffect, useLayoutEffect, } from 'react';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

import { EmployeeNodeCard, type EmployeeNodeData } from './nodes/EmployeeNodeCard';

// ----------------------------------------------------------------------

type Props = {
  node: Node | null;
  open: boolean;
  onClose: () => void;
  position: { x: number; y: number };
};

export function NodeDetailOverlay({ node, open, onClose, position }: Props) {
  const theme = useTheme();
  const nodeData = node?.data as unknown as EmployeeNodeData;
  const containerRef = useRef<HTMLDivElement>(null);

  // Adjust position to stay within container bounds
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useLayoutEffect(() => {
    if (open && position && containerRef.current) {
      const overlayWidth = 360; // Min width of card
      const overlayHeight = 500; // Estimated height of card
      const padding = 20;

      // Get container dimensions (we assume the parent is the relative container)
      const container = containerRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      // Calculate max available space
      const maxX = containerRect.width - overlayWidth - padding;
      const maxY = containerRect.height - overlayHeight - padding;

      let x = position.x + 20;
      let y = position.y;

      // Check right edge
      if (x > maxX) {
        x = position.x - overlayWidth - 20;
      }

      // Check bottom edge
      if (y > maxY) {
        y = Math.max(padding, containerRect.height - overlayHeight - padding);
      }

      // Check left edge
      if (x < padding) {
        x = padding;
      }

      // Check top edge
      if (y < padding) {
        y = padding;
      }

      setAdjustedPosition({ x, y });
    }
  }, [position, open]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!node) return null;

  return (
    <Fade in={open} timeout={200}>
      <Box
        ref={containerRef}
        onClick={(e) => e.stopPropagation()} // Prevent click from propagating to diagram
        sx={{
          position: 'absolute', // Absolute to the diagram container
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 10, // Lower z-index to stay below drawers/modals
          filter: `drop-shadow(0 8px 32px ${alpha(theme.palette.common.black, 0.24)})`,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
            }
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 9,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.neutral' }
            }}
          >
            <Iconify icon="mingcute:close-line" />
          </IconButton>

          {nodeData && <EmployeeNodeCard data={nodeData} selected={false} disableHoverTransform />}
        </Box>
      </Box>
    </Fade>
  );
}
