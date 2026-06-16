import type { BoxProps } from '@mui/material/Box';
import type { TypographyProps } from '@mui/material/Typography';
import type { IKanbanTask } from 'src/types/kanban';
import type { IconifyName, IconifyProps } from 'src/components/iconify';

import dayjs from 'dayjs';
import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { Iconify } from 'src/components/iconify';
import { imageClasses } from 'src/components/image';

import { kanbanClasses } from '../classes';

// ----------------------------------------------------------------------

export const DropIndicator = styled('div')(({ theme }) => ({
  flexShrink: 0,
  borderRadius: 'var(--kanban-item-radius)',
  backgroundColor: theme.vars.palette.action.hover,
  border: `dashed 1px ${theme.vars.palette.shared.paperOutlined}`,
}));

export const ItemPreview = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.vars.palette.background.paper,
}));

/* **********************************************************************
 * Item elements
 * **********************************************************************/
export const ItemRoot = styled(m.li)(({ theme }) => {
  const transitionKey = 'moveFlash';

  return {
    [`@keyframes ${transitionKey}`]: {
      from: { transform: 'scale(0.98)' },
      to: { transform: 'scale(1)' },
    },
    flexShrink: 0,
    cursor: 'grab',
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    borderRadius: 'var(--kanban-item-radius)',
    backgroundColor: theme.vars.palette.common.white,
    transition: theme.transitions.create(['filter', 'box-shadow', 'background-color']),
    ...theme.applyStyles('dark', {
      backgroundColor: theme.vars.palette.grey[900],
    }),
    '&:hover': {
      boxShadow: theme.vars.customShadows.z8,
    },
    [`&.${kanbanClasses.state.dragging}`]: {
      filter: 'grayscale(1)',
      '& > *': { opacity: 0.4 },
    },
    [`&.${kanbanClasses.state.draggingAndLeftSelf}`]: {
      display: 'none',
    },
    [`&.${kanbanClasses.state.flash}`]: {
      animation: `${transitionKey} 320ms ease-in-out`,
    },
    [`&.${kanbanClasses.state.openDetails}`]: {
      backgroundColor: theme.vars.palette.action.selected,
      '& > *': { opacity: 0.8 },
    },
  };
});

export const ItemContent = styled('div')(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2.5, 2),
}));

// ----------------------------------------------------------------------

export type ItemNameProps = TypographyProps & {
  name: IKanbanTask['name'];
};

export function ItemName({ name, sx, ...other }: ItemNameProps) {
  return (
    <Typography
      component="span"
      variant="subtitle2"
      sx={[{ display: 'block', wordBreak: 'break-word' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      {name}
    </Typography>
  );
}

// ----------------------------------------------------------------------

export type ItemImageProps = BoxProps & {
  attachments: IKanbanTask['attachments'];
};

export function ItemImage({ sx, attachments, ...other }: ItemImageProps) {
  if (!attachments.length) return null;

  return (
    <Box
      sx={[{ pt: 1, px: 1, pointerEvents: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
      {...other}
    >
      <Box
        component="img"
        className={imageClasses.root}
        alt={attachments[0]}
        src={attachments[0]}
        sx={[
          (theme) => ({
            width: 1,
            borderRadius: 1.5,
            height: 'auto',
            aspectRatio: '4/3',
            objectFit: 'cover',
            transition: theme.transitions.create(['opacity', 'filter'], {
              duration: theme.transitions.duration.shortest,
            }),
          }),
        ]}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

export type ItemStatusProps = Omit<IconifyProps, 'icon'> & {
  status: IKanbanTask['priority'];
};

export function ItemStatus({ sx, status, ...other }: ItemStatusProps) {
  return (
    <Iconify
      icon={
        (status === 'low' && 'solar:double-alt-arrow-down-bold-duotone') ||
        (status === 'medium' && 'solar:double-alt-arrow-right-bold-duotone') ||
        'solar:double-alt-arrow-up-bold-duotone'
      }
      sx={[
        {
          top: 4,
          right: 4,
          position: 'absolute',
          color: 'error.main',
          ...(status === 'low' && { color: 'info.main' }),
          ...(status === 'medium' && { color: 'warning.main' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    />
  );
}

// ----------------------------------------------------------------------

export type ItemInfoProps = BoxProps &
  Pick<IKanbanTask, 'assignee' | 'comments' | 'attachments'> & {
    due?: IKanbanTask['due'];
    subtaskCount?: IKanbanTask['subtaskCount'];
  };

export function ItemInfo({ sx, assignee, comments, attachments, subtaskCount, due, ...other }: ItemInfoProps) {
  const hasComments = !!comments.length;
  const hasAttachments = !!attachments.length;
  const hasSubtasks = !!subtaskCount && subtaskCount.total > 0;

  const rawDate = due?.[1] || due?.[0];
  const formattedDate = rawDate
    ? dayjs(rawDate).format(dayjs(rawDate).year() === dayjs().year() ? 'DD MMM' : 'DD MMM YYYY')
    : null;

  const renderInfo = (icon: IconifyName, count: number) => (
    <Box
      sx={{
        gap: 0.25,
        display: 'flex',
        alignItems: 'center',
        typography: 'caption',
        color: 'text.disabled',
      }}
    >
      <Iconify width={16} icon={icon} />
      <Box component="span">{count}</Box>
    </Box>
  );

  return (
    <Box
      sx={[
        {
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          width: '100%',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* Left: date + counters */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {formattedDate && (
          <Box sx={{ gap: 0.25, display: 'flex', alignItems: 'center', color: 'text.disabled', flexShrink: 0 }}>
            <Typography variant="caption" sx={{ whiteSpace: 'nowrap' }}>
              {formattedDate}
            </Typography>
          </Box>
        )}

        {hasComments && renderInfo('solar:chat-round-dots-bold', comments.length)}
        {hasAttachments && renderInfo('eva:attach-2-fill', attachments.length)}

        {hasSubtasks && (
          <Box
            sx={{
              gap: 0.5,
              display: 'flex',
              alignItems: 'center',
              typography: 'caption',
              color: subtaskCount!.done === subtaskCount!.total ? 'success.main' : 'text.disabled',
            }}
          >
            <Iconify width={14} icon="solar:checklist-minimalistic-bold" />
            <Box component="span">{subtaskCount!.done}/{subtaskCount!.total}</Box>
          </Box>
        )}
      </Box>

      {/* Right: avatar */}
      {assignee.length > 0 ? (
        <AvatarGroup
          sx={{
            flexShrink: 0,
            [`& .${avatarGroupClasses.avatar}`]: { width: 24, height: 24 },
          }}
        >
          {assignee.map((user) => (
            <Avatar key={user.id} alt={user.name} src={user.avatarUrl} sx={{ fontSize: 10 }}>
              {!user.avatarUrl &&
                user.name
                  ?.split(' ')
                  .slice(0, 2)
                  .map((w) => w.charAt(0).toUpperCase())
                  .join('')}
            </Avatar>
          ))}
        </AvatarGroup>
      ) : (
        <Avatar sx={{ width: 24, height: 24, bgcolor: 'text.disabled', flexShrink: 0 }}>
          <Iconify icon="solar:user-bold" width={14} />
        </Avatar>
      )}
    </Box>
  );
}
