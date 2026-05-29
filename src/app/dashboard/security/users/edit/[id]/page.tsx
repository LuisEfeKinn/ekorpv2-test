import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { UsersEditView } from 'src/sections/users/view/users-edit-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit User - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <UsersEditView id={id} />;
}