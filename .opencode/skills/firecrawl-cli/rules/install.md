# Firecrawl CLI Installation

## Quick Setup

```bash
npm install -g firecrawl-cli
firecrawl login --browser
```

This opens browser for OAuth. API key stored automatically.

## API Key Setup

```bash
export FIRECRAWL_API_KEY=fc-your-api-key
```

Get key at https://firecrawl.dev.

## Verify

```bash
firecrawl --status
```

Should show authenticated status with credit balance.

## Troubleshooting

- "Not authenticated": Run `firecrawl login --browser`
- "Command not found": Run `npm install -g firecrawl-cli`
- "Rate limited": Check credits at firecrawl.dev dashboard
