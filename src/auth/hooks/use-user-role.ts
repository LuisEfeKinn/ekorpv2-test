import { useAuthContext } from './use-auth-context';
import { isAdmin, hasRoleById, isSuperAdmin } from '../utils/dashboard-routes';

// ----------------------------------------------------------------------

export function useUserRole() {
  const { user } = useAuthContext();

  return {
    user,
    userRole: user?.roles?.[0]?.name,
    isAdmin: isAdmin(user),
    isSuperAdmin: isSuperAdmin(user),
    hasRoleById: (roleId: string) => hasRoleById(user, roleId),
    roles: user?.roles || [],
  };
}