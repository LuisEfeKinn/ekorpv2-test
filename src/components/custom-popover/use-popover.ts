import { useState, useCallback } from 'react';

// ----------------------------------------------------------------------

type ReturnType = {
  open: boolean;
  anchorEl: HTMLElement | null;
  onOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
  setAnchorEl: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
};

export function usePopover(): ReturnType {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const onOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const onClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return {
    open: !!anchorEl,
    anchorEl,
    onOpen,
    onClose,
    setAnchorEl,
  };
}
