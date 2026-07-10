# Say the Hard Thing — deployment guide

This turns the prototype into a real, live app at its own URL, with the API key
kept safely on a server instead of exposed in the browser.

## What's in this folder

```
say-the-hard-thing/
├── index.html       ← the app itself (frontend)
├── api/
│   └── generate.js  ← backend function that calls Claude, keeps your API key private
└── package.json
```

## Step 1 — Get an Anthropic API key

1. Go to https://console.anthropic.com and sign up / log in.
2. Go to "API Keys" and create a new key.
3. Add a small amount of billing credit (a few dollars covers a lot of testing —
   each generation costs a fraction of a cent).
4. Copy the key somewhere safe. You won't be able to see it again after this.

## Step 2 — Deploy to Vercel (free tier, no server management)

You don't need to touch a terminal if you don't want to:

1. Go to https://vercel.com and sign up (free — GitHub login is easiest).
2. Put this folder in a GitHub repository:
   - Easiest way: go to https://github.com/new, create a repo, then drag-and-drop
     this whole folder's contents into it via GitHub's web upload, or use
     `git init && git add . && git commit -m "initial" && git push` if you're
     comfortable with git.
3. In Vercel, click "Add New Project," pick that GitHub repo, and click Deploy.
   Vercel will auto-detect the `api/` folder as serverless functions and
   `index.html` as a static page — no configuration needed.
4. Before or after the first deploy, go to your Vercel project → Settings →
   Environment Variables, and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: the key you copied in Step 1
   Then redeploy (Vercel → Deployments → click the "..." menu → Redeploy) so the
   function picks up the new variable.

That's it — Vercel gives you a live URL like `say-the-hard-thing.vercel.app`.

## Step 3 (optional) — Add a custom domain

In Vercel → your project → Settings → Domains, you can attach a domain you own,
or buy one directly through Vercel's registrar integration.

## Step 4 (optional) — Test it locally before deploying

If you have Node.js installed:

```bash
npm install -g vercel
cd say-the-hard-thing
vercel dev
```

This runs the exact same setup locally at `http://localhost:3000`, using a
`.env` file for the API key instead of Vercel's dashboard:

```
# .env (create this file, don't commit it)
ANTHROPIC_API_KEY=your-key-here
```

## Cost and abuse protection — read this before sharing the link widely

Each generation is one Claude API call. Sonnet is inexpensive, but if you
share the link publicly, nothing currently stops someone from spamming the
button and running up a bill. Two easy protections, roughly in order of
effort:

- **Cheapest fix**: in Vercel dashboard → your project → Settings, set a
  spending limit / usage alert so you can't be surprised by a bill.
- **Better fix**: add basic per-IP rate limiting inside `api/generate.js`
  (e.g. using Vercel KV or Upstash Redis to track requests per IP per hour).
  Worth doing before sharing this outside a small circle of friends.

## Turning this into a "real" mobile app later (optional, not needed to ship)

You don't need this to have a working app — the website above works fine on
phones as-is, and people can "Add to Home Screen" from their mobile browser
for an app-like icon. If you later want an actual App Store / Play Store
listing, the fastest path is wrapping this same code with a tool like
Capacitor, which turns a website into a native app shell without a rewrite —
but that's a later step, not a blocker to shipping now.
