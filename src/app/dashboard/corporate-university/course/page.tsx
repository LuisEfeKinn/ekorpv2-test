import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProductCoursesView } from 'src/sections/product-courses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Course Catalogs - ${CONFIG.appName}` };

export default function Page() {
  return <ProductCoursesView />;
}