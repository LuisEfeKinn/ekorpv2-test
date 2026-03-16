import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { RoleEditView } from 'src/sections/roles/view/roles-edit';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Role - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <RoleEditView id={id} />;
}