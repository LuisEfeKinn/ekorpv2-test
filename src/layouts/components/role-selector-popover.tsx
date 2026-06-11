'use client';

import type { ButtonProps } from '@mui/material/Button';

import { m } from 'framer-motion';
import { useState, useCallback } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';
import { varTap, varHover, transitionTap } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function RoleSelectorPopover({ sx, ...other }: ButtonProps) {
  const { user, setActiveRole } = useAuthContext();

  const { open, anchorEl, onClose, onOpen } = usePopover();

  const [isChangingRole, setIsChangingRole] = useState(false);

  const roles = user?.roles ?? [];
  const currentRole =
    roles.find((role) => role.id === user?.activeRoleId) ??
    roles.find((role) => role.name === user?.role) ??
    roles[0];
  const otherRoles = roles.filter((role) => role.id !== currentRole?.id);
  const hasMultipleRoles = otherRoles.length > 0;

  const handleSelectRole = useCallback(
    async (roleId: string) => {
      if (!setActiveRole) {
        return;
      }

      try {
        setIsChangingRole(true);
        onClose();
        await setActiveRole(roleId);
      } catch (error) {
        console.error(error);
        toast.error('No fue posible cambiar de cargo');
      } finally {
        setIsChangingRole(false);
      }
    },
    [onClose, setActiveRole]
  );

  if (!currentRole) {
    return null;
  }

  return (
    <>
      <Button
        color="inherit"
        component={m.button}
        variant="outlined"
        whileTap={varTap(0.96)}
        whileHover={varHover(1.02)}
        transition={transitionTap()}
        aria-label="Selector de cargos"
        onClick={hasMultipleRoles ? onOpen : undefined}
        disabled={isChangingRole || !hasMultipleRoles}
        startIcon={<Iconify width={18} icon="solar:shield-keyhole-bold-duotone" />}
        endIcon={
          isChangingRole ? (
            <CircularProgress size={14} color="inherit" />
          ) : hasMultipleRoles ? (
            <Iconify
              width={16}
              icon={open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'}
            />
          ) : null
        }
        sx={[
          (theme) => ({
            px: 1.25,
            minWidth: 0,
            height: 40,
            borderRadius: 999,
            borderColor: theme.vars.palette.divider,
            bgcolor: open ? theme.vars.palette.action.selected : 'transparent',
            '&:hover': { borderColor: theme.vars.palette.text.disabled },
            '&.Mui-disabled': {
              borderColor: theme.vars.palette.divider,
              color: theme.vars.palette.text.disabled,
              opacity: 1,
            },
            '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 }, ml: 0 },
            '& .MuiButton-endIcon': { ml: 0.5 },
          }),
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        <Box
          component="span"
          sx={{
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: { xs: 'none', sm: 'inline' },
          }}
        >
          {currentRole.name}
        </Box>
      </Button>

      <CustomPopover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        slotProps={{ paper: { sx: { p: 1, width: 240 } }, arrow: { offset: 18 } }}
      >
        <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary' }}>
            {hasMultipleRoles ? 'Cambiar cargo' : 'Cargo actual'}
          </Typography>

          <Typography variant="subtitle2" noWrap>
            {currentRole.name}
          </Typography>
        </Box>

        {hasMultipleRoles && (
          <MenuList sx={{ p: 1 }}>
            {otherRoles.map((role) => (
              <MenuItem
                key={role.id}
                disabled={isChangingRole}
                onClick={() => handleSelectRole(role.id)}
              >
                <Iconify width={18} icon="solar:user-id-bold" />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {role.name}
                  </Typography>
                </Box>

                <Iconify width={16} icon="eva:arrow-ios-forward-fill" />
              </MenuItem>
            ))}
          </MenuList>
        )}
      </CustomPopover>
    </>
  );
}