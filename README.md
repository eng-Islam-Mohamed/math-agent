# Math Agent

Math Agent is a mathematics solving workspace with complexity-based model routing, a second review pass, optional symbolic checks, multimodal input, PDF reports, and optional Gmail and Google Sheets delivery.

## Public portfolio demo

`frontend/` is the Vercel demo. It accepts **text problems** and displays a live answer and an independent AI review. Its server-side route never exposes the OpenRouter key to visitors. Image, audio, Google delivery, and the richer PDF workflow remain in the original Python application and are not enabled in the public demo.

The public review is an AI review, not a formal proof. Browser Print can save a result as a PDF. Public requests must be protected by a Vercel Firewall rate-limit rule and an OpenRouter spending limit.

### Run locally

1. In `frontend/`, run `npm ci`.
2. Set `OPENROUTER_API_KEY` in `frontend/.env.local`.
3. Run `npm run dev`.

The full local Python implementation is in `maths_ai_agent/`, with its FastAPI wrapper in `backend/`. See `PROJECT.md` for its workflow. Google tokens, API keys, generated files, and past user submissions are deliberately excluded from this repository.
