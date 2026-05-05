import type { Editor } from '@tiptap/react';

import { useMemo, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { usePopover } from 'minimal-shared/hooks';
import { useEditorState } from '@tiptap/react';

import Menu from '@mui/material/Menu';
import { listClasses } from '@mui/material/List';
import ButtonBase, { buttonBaseClasses } from '@mui/material/ButtonBase';

import { Iconify } from '../../iconify';
import { ToolbarItem } from './toolbar-item';

// ----------------------------------------------------------------------

const FONT_SIZES = [
  { label: '8', value: '8px' },
  { label: '10', value: '10px' },
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
  { label: '36', value: '36px' },
  { label: '48', value: '48px' },
] as const;

// ----------------------------------------------------------------------

type Props = { editor: Editor };

export function FontSizeBlock({ editor }: Props) {
  const { anchorEl, open, onOpen, onClose } = usePopover();

  const currentSize = useEditorState({
    editor,
    selector: (ctx) => {
      const attrs = ctx.editor.getAttributes('fontSize');
      return (attrs.fontSize as string | undefined) ?? null;
    },
  });

  const selectedLabel = useMemo(() => {
    if (!currentSize) return 'Tamaño';
    const match = FONT_SIZES.find((f) => f.value === currentSize);
    return match ? match.label : currentSize.replace('px', '');
  }, [currentSize]);

  const handleSelect = useCallback(
    (value: string | null) => {
      onClose();
      if (value) {
        editor.chain().focus().setFontSize(value).run();
      } else {
        editor.chain().focus().unsetFontSize().run();
      }
    },
    [editor, onClose]
  );

  const buttonId = 'font-size-menu-button';
  const menuId = 'font-size-menu';

  return (
    <>
      <ButtonBase
        id={buttonId}
        aria-label="Font size menu"
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={onOpen}
        sx={(theme) => ({
          px: 1,
          gap: 0.5,
          width: 84,
          height: 32,
          borderRadius: 0.75,
          typography: 'body2',
          fontWeight: 'fontWeightMedium',
          justifyContent: 'space-between',
          border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
        })}
      >
        {selectedLabel}
        <Iconify
          width={16}
          icon={open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
        />
      </ButtonBase>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        slotProps={{
          list: { 'aria-labelledby': buttonId },
          paper: {
            sx: {
              width: 84,
              maxHeight: 320,
              overflowY: 'auto',
              [`& .${listClasses.root}`]: { gap: 0.5, display: 'flex', flexDirection: 'column' },
              [`& .${buttonBaseClasses.root}`]: {
                px: 1,
                width: 1,
                height: 34,
                borderRadius: 0.75,
                justifyContent: 'flex-start',
                '&:hover': { backgroundColor: 'action.hover' },
              },
            },
          },
        }}
      >
        <ToolbarItem
          component="li"
          aria-label="Predeterminado"
          label="Default"
          active={!currentSize}
          onClick={() => handleSelect(null)}
        />
        {FONT_SIZES.map((option) => (
          <ToolbarItem
            key={option.value}
            component="li"
            aria-label={option.label}
            label={option.label}
            active={currentSize === option.value}
            onClick={() => handleSelect(option.value)}
          />
        ))}
      </Menu>
    </>
  );
}
