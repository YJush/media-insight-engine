# Article Insight Engine

[![CI](https://github.com/industry-contents/article-insight-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/industry-contents/article-insight-engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-B8390D.svg)](LICENSE)

Paste an article URL and get a structured editorial read: summary, decision risks, promotional intent, potential conflicts of interest and missing perspectives. Built for journalists, analysts and buyers who need to judge a piece of business or technology coverage quickly.

Built by [Industry Contents](https://industrycontents.com).

## How it works

1. The article is fetched and converted to clean text with [Jina Reader](https://jina.ai/reader/).
2. A Supabase Edge Function (`analyze-article`) sends the text to Google Gemini with a structured prompt.
3. The React interface renders the response as expandable sections.

The output is a set of questions to investigate. It does not verify claims or cross-check other sources.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase Edge Functions, Google Gemini.

## Getting started

```sh
git clone https://github.com/industry-contents/article-insight-engine.git
cd article-insight-engine
cp .env.example .env   # add your own Supabase project values
npm ci
npm run dev
```

Deploy the edge function to your own Supabase project and store the model key as a server-side secret:

```sh
supabase secrets set GOOGLE_API_KEY=your-key
supabase functions deploy analyze-article
```

The key never goes in `.env` or any `VITE_` variable. Only the Supabase URL and anon key are used in the browser.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

## Security

- Secrets live in Supabase secrets, not in the repository. See [SECURITY.md](SECURITY.md).
- The edge function accepts http(s) URLs only and caps input length.
- Enable rate limiting on the function in your Supabase project before exposing it publicly.

## Contributing

Issues and pull requests are welcome. Run `npm run lint` and `npm run build` first.

## License

[MIT](LICENSE) © Yajush Gupta
