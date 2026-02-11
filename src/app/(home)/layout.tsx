import type { Metadata } from 'next';

import { MainLayout } from 'src/layouts/main';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Redirigiendo...',
  description: 'Redirigiendo al sistema de autenticación',
};

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <MainLayout>{children}</MainLayout>;
}
