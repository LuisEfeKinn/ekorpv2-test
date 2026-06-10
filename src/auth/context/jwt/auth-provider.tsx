'use client';

import type { UserRole , AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';
import { ACCESS_TOKEN_KEY, ACTIVE_ROLE_ID_KEY } from './constant';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const persistActiveRoleId = useCallback((roleId?: string | null) => {
    if (!roleId) {
      sessionStorage.removeItem(ACTIVE_ROLE_ID_KEY);
      return;
    }

    sessionStorage.setItem(ACTIVE_ROLE_ID_KEY, roleId);
  }, []);

  const resolveActiveRole = useCallback((roles: UserRole[] = [], requestedRoleId?: string) => {
    if (!roles.length) {
      return null;
    }

    return roles.find((role) => role.id === requestedRoleId) ?? roles[0];
  }, []);

  const checkUserSession = useCallback(async (roleId?: string) => {
    try {
      const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRoleId = sessionStorage.getItem(ACTIVE_ROLE_ID_KEY);
      const requestedRoleId = roleId ?? storedRoleId ?? undefined;

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me, {
          params: requestedRoleId ? { roleId: requestedRoleId } : undefined,
        });

        const { data } = res.data;

        if (data) {
          const activeRole = resolveActiveRole(data.roles, requestedRoleId);

          persistActiveRoleId(activeRole?.id ?? null);

          setState({ 
            user: { 
              ...data, 
              accessToken,
              // Mapear campos para compatibilidad
              displayName: data.names,
              email: data.email,
              photoURL: data.avatar ?? null,
              activeRoleId: activeRole?.id,
              role: activeRole?.name ?? 'admin',
              // Agregar roles y módulos
              roles: data.roles,
              modules: data.modules
            }, 
            loading: false 
          });
        } else {
          persistActiveRoleId(null);
          setState({ user: null, loading: false });
        }
      } else {
        persistActiveRoleId(null);
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      persistActiveRoleId(null);
      setState({ user: null, loading: false });
    }
  }, [persistActiveRoleId, resolveActiveRole, setState]);

  const setActiveRole = useCallback(async (roleId: string) => {
    persistActiveRoleId(roleId);
    await checkUserSession(roleId);
    if (sessionStorage.getItem(ACTIVE_ROLE_ID_KEY) !== roleId) {
      throw new Error('Selected role could not be applied');
    }
  }, [checkUserSession, persistActiveRoleId]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      setActiveRole,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, setActiveRole, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
