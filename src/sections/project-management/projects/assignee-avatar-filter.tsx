import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { stringToAvatarColor } from 'src/utils/avatar-color';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export type AssigneeFilterOption = {
  id: string; // 'unassigned' for tasks with no assignee
  label: string;
};

type Props = {
  assignees: AssigneeFilterOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
};

const MAX_VISIBLE = 5;

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

// ----------------------------------------------------------------------

export function AssigneeAvatarFilter({ assignees, selected, onChange }: Props) {
  const overflowPopover = usePopover();

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const hasFilter = selected.length > 0;
  const visible = assignees.slice(0, MAX_VISIBLE);
  const overflow = assignees.slice(MAX_VISIBLE);
  const overflowSelectedCount = overflow.filter((o) => selected.includes(o.id)).length;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((opt, index) => {
        const isSelected = selected.includes(opt.id);
        const dimmed = hasFilter && !isSelected;

        return (
          <Tooltip key={opt.id} title={opt.label} arrow>
            <Avatar
              onClick={() => toggle(opt.id)}
              sx={{
                width: 32,
                height: 32,
                fontSize: 11,
                cursor: 'pointer',
                ml: index === 0 ? 0 : '-8px',
                zIndex: visible.length - index,
                border: (theme) => `2px solid ${theme.vars.palette.background.paper}`,
                transition: 'opacity 0.15s',
                opacity: dimmed ? 0.4 : 1,
                ...(opt.id !== 'unassigned' && { bgcolor: stringToAvatarColor(opt.id), color: '#fff' }),
                ...(isSelected && {
                  outline: (theme: any) => `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                }),
              }}
            >
              {opt.id === 'unassigned' ? (
                <Iconify icon="solar:user-bold" width={15} />
              ) : (
                getInitials(opt.label)
              )}
            </Avatar>
          </Tooltip>
        );
      })}

      {overflow.length > 0 && (
        <>
          <Tooltip
            title={
              overflowSelectedCount > 0
                ? `${overflowSelectedCount} más seleccionados`
                : `+${overflow.length} más`
            }
            arrow
          >
            <Avatar
              onClick={overflowPopover.onOpen}
              sx={{
                width: 32,
                height: 32,
                fontSize: 11,
                cursor: 'pointer',
                ml: '-8px',
                zIndex: 0,
                border: (theme) => `2px solid ${theme.vars.palette.background.paper}`,
                bgcolor: overflowSelectedCount > 0 ? 'primary.main' : 'text.disabled',
                ...(overflowSelectedCount > 0 && {
                  outline: (theme: any) => `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                }),
              }}
            >
              +{overflow.length}
            </Avatar>
          </Tooltip>

          <CustomPopover
            open={overflowPopover.open}
            anchorEl={overflowPopover.anchorEl}
            onClose={overflowPopover.onClose}
            slotProps={{ arrow: { placement: 'top-left' } }}
          >
            <MenuList sx={{ minWidth: 220 }}>
              {overflow.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <MenuItem key={opt.id} onClick={() => toggle(opt.id)} dense>
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      disableRipple
                      sx={{ p: 0.5, mr: 1 }}
                    />
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        fontSize: 9,
                        mr: 1.5,
                        flexShrink: 0,
                        ...(opt.id !== 'unassigned' && { bgcolor: stringToAvatarColor(opt.id), color: '#fff' }),
                      }}
                    >
                      {opt.id === 'unassigned' ? (
                        <Iconify icon="solar:user-bold" width={12} />
                      ) : (
                        getInitials(opt.label)
                      )}
                    </Avatar>
                    <ListItemText
                      primary={opt.label}
                      slotProps={{ primary: { variant: 'body2', noWrap: true } }}
                    />
                  </MenuItem>
                );
              })}
            </MenuList>

            {overflowSelectedCount > 0 && (
              <Box
                sx={{ px: 2, py: 1, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}` }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: 'primary.main', cursor: 'pointer' }}
                  onClick={() => {
                    const overflowIds = overflow.map((o) => o.id);
                    onChange(selected.filter((s) => !overflowIds.includes(s)));
                    overflowPopover.onClose();
                  }}
                >
                  Limpiar selección de este grupo
                </Typography>
              </Box>
            )}
          </CustomPopover>
        </>
      )}
    </Box>
  );
}
