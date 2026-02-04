import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProductCoursesEditView } from 'src/sections/product-courses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Product Course - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  
  return <ProductCoursesEditView id={id} />;
}
