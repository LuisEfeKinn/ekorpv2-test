import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersAdministrationRolesEditView } from 'src/sections/users-clarity/view/users-administration-roles-edit-view';

export const metadata: Metadata = { title: `Edit Role - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <UsersAdministrationRolesEditView id={id} />;
}

