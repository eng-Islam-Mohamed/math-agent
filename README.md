# Math Agent

Math Agent is a mathematics solving workspace with complexity-based model routing, a second review pass, optional symbolic checks, multimodal input, PDF reports, and optional Gmail and Google Sheets delivery.

## Public portfolio demo

Live site: https://math-agent-demo.vercel.app

`frontend/` is the Vercel portfolio version of the original interface. It accepts **text, photo, and voice problems** and displays a live answer and an independent AI review. Its server-side route never exposes the OpenRouter key to visitors. The richer Python PDF workflow and optional Gmail/Google Sheets delivery remain in the local application; the public site offers browser PDF export instead.

The public review is an AI review, not a formal proof. Browser Print can save a result as a PDF. The Vercel Firewall currently limits the solve route to three requests per IP every ten minutes. Files are processed in memory and are not stored by the public route. An OpenRouter key spending cap is recommended for an account-wide cost ceiling.

### Run locally

1. In `frontend/`, run `npm ci`.
2. Set `OPENROUTER_API_KEY` in `frontend/.env.local`.
3. Run `npm run dev`.

The full local Python implementation is in `maths_ai_agent/`, with its FastAPI wrapper in `backend/`. See `PROJECT.md` for its workflow. Google tokens, API keys, generated files, and past user submissions are deliberately excluded from this repository.
