import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { ProductCoursesView } from 'src/sections/product-courses/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Product Courses - ${CONFIG.appName}` };

export default function Page() {
  return <ProductCoursesView />;
}