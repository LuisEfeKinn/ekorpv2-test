import type { InputBaseProps } from '@mui/material/InputBase';

import InputBase, { inputBaseClasses } from '@mui/material/InputBase';

// ----------------------------------------------------------------------

const blockEnterKey = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  if (e.key === 'Enter') e.preventDefault();
};

type KanbanInputNameProps = InputBaseProps & {
  typographyVariant?: string;
};

export function KanbanInputName({ sx, onKeyDown, typographyVariant = 'h6', ...other }: KanbanInputNameProps) {
  return (
    <InputBase
      multiline
      onKeyDown={(e) => {
        blockEnterKey(e);
        onKeyDown?.(e);
      }}
      sx={[
        (theme) => ({
          [`&.${inputBaseClasses.root}`]: {
            py: 0.75,
            borderRadius: 1,
            typography: typographyVariant,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: 'transparent',
            transition: theme.transitions.create(['padding-left', 'border-color']),
            [`&.${inputBaseClasses.focused}`]: { pl: 0.75, borderColor: 'text.primary' },
          },
          [`& .${inputBaseClasses.input}`]: { typography: typographyVariant },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}
