import { CONFIG } from 'src/global-config';

import { ProductCoursesDetailsView } from 'src/sections/product-courses/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Product Course Details - ${CONFIG.appName}` };

export default function Page() {
  return <ProductCoursesDetailsView />;
}
