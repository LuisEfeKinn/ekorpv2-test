## Prerequisites

- Node.js >=20 (Recommended)

## Installation

**Using Yarn (Recommended)**

```sh
yarn install
yarn dev
```

**Using Npm**

```sh
npm i
npm run dev
```

## Build

```sh
yarn build
# or
npm run build
```

## Mock server

By default we provide demo data from : `https://api-dev-minimal-[version].vercel.app`

To set up your local server:

- **Guide:** [https://docs.minimals.cc/mock-server](https://docs.minimals.cc/mock-server).

- **Resource:** [Download](https://www.dropbox.com/scl/fo/bopqsyaatc8fbquswxwww/AKgu6V6ZGmxtu22MuzsL5L4?rlkey=8s55vnilwz2d8nsrcmdo2a6ci&dl=0).

## Full version

- Create React App ([migrate to CRA](https://docs.minimals.cc/migrate-to-cra/)).
- Next.js
- Vite.js

## Starter version

- To remove unnecessary components. This is a simplified version ([https://starter.minimals.cc/](https://starter.minimals.cc/))
- Good to start a new project. You can copy components from the full version.
- Make sure to install the dependencies exactly as compared to the full version.

---

**NOTE:**
_When copying folders remember to also copy hidden files like .env. This is important because .env files often contain environment variables that are crucial for the application to run correctly._

---

## 🔐 Environment Variables – AI Providers

The AI Course Generator module requires environment variables to connect with various AI providers. All credentials are stored securely in the `.env` file and accessed via `src/config/ai-env.ts`.

### Required Variables

| Variable | Provider | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | OpenAI | API key from [OpenAI Platform](https://platform.openai.com/api-keys) |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini | API key from [Google AI Studio](https://aistudio.google.com/apikey) |
| `DEEPSEEK_API_KEY` | DeepSeek | API key from [DeepSeek Platform](https://platform.deepseek.com/) |
| `MINIMAX_API_KEY` | Minimax | API key from Minimax dashboard |
| `MINIMAX_GROUP_ID` | Minimax | Group ID for Minimax authentication |

### Optional Variables (Azure OpenAI)

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI resource key |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name in Azure |

### Example `.env` Configuration

```env
# AI Providers Configuration
# ----------------------------------------------------------------------

# OpenAI (Required for GPT models)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx

# Google Gemini
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxx

# DeepSeek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# Minimax
MINIMAX_API_KEY=eyJhbGciOixxxxxxxxx
MINIMAX_GROUP_ID=1234567890

# Azure OpenAI (Optional)
# AZURE_OPENAI_API_KEY=xxxxxxxxxxxxxxxx
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### Usage in Code

Always use the centralized configuration:

```typescript
import { getOpenAIConfig, isProviderConfigured } from 'src/config/ai-env';

// Check if provider is available
if (isProviderConfigured('openai')) {
  const config = getOpenAIConfig();
  // Use config.apiKey
}
```

### Security Notes

- ⚠️ **Never hardcode API keys** in source code
- ⚠️ **Never expose keys to the client** - use server-side API routes
- ⚠️ **Never commit `.env` files** to version control
- ✅ All AI operations should run via backend/API routes
- ✅ Use the `AI_ENV` object from `src/config/ai-env.ts` for all access
