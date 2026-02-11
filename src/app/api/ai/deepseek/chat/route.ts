import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

// NOTE: DeepSeek is not in the current provider list
// This route is kept for backwards compatibility but will return an error

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // DeepSeek is not currently configured as a provider
  return NextResponse.json(
    { error: 'DeepSeek provider is not currently available. Please use OpenAI, Google AI, or MiniMax.' },
    { status: 501 }
  );
}
