import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import AiAssistant from 'src/components/ai-assistant/ai-assistant';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const AI_ASSISTANT_WIDGET_ID = 'ceb1594e-4616-4665-b375-92594599e9a1';

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  if (CONFIG.auth.skip) {
    return (
      <DashboardLayout>
        <AiAssistant widgetId={AI_ASSISTANT_WIDGET_ID} />
        {children}
      </DashboardLayout>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <AiAssistant widgetId={AI_ASSISTANT_WIDGET_ID} />
        {children}
      </DashboardLayout>
    </AuthGuard>
  );
}
