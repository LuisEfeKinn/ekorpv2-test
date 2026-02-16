import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PermissionsRoleView } from 'src/sections/permissions/view/permissions-role-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Role Permissions - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <PermissionsRoleView roleId={id} />;
}