'use client';

// import type { Metadata } from 'next';

import { useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';
import { getDashboardRoute } from 'src/auth/utils/dashboard-routes';

// ----------------------------------------------------------------------

// Nota: El metadata no funciona en componentes client, se puede mover a layout si es necesario

export default function Page() {
  const router = useRouter();
  const { authenticated, loading, user } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (authenticated) {
        // Si ya está autenticado, redirigir al dashboard apropiado según su rol/módulos
        const dashboardRoute = getDashboardRoute(user);
        router.replace(dashboardRoute);
      } else {
        // Si no está autenticado, redirigir al login JWT
        router.replace(paths.auth.jwt.signIn);
      }
    }
  }, [authenticated, loading, router, user]);

  // Mostrar loading mientras se verifica la autenticación
  return <SplashScreen />;
}
