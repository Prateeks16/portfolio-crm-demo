# Portfolio CRM — Live Demo

A shareable, self-contained demo of my **portfolio CRM**: a system that is both a
public portfolio and a private outbound-outreach CRM over one content store.

This build is the **real dashboard UI**, running against seeded sample data in the
browser — so anyone can click through it without a login they need to be given,
without a backend to wake up, and without touching any real contacts.

> **Live demo:** _add your Vercel URL here after deploying_
> **Sign in:** username `demo` · password `demo` (already pre-filled)

---

## What you can explore

- **Overview** — a work queue of what needs attention: overdue follow-ups, nudges due, open drafts.
- **Leads** — a seven-stage pipeline (new → contacted → applied → replied → interviewing → offer → won/lost) as a board or table, with per-lead detail and an append-only activity timeline.
- **Outreach & Templates** — reusable email templates with `{{placeholder}}` rendering, drafts, and a send flow (simulated in the demo — nothing is transmitted).
- **Inbox & Mail** — contact-form messages and a mirrored email inbox, each convertible into a tracked lead.
- **Tasks** — follow-ups with due dates and priorities.
- **Analytics** — privacy-preserving first-party traffic (page views, unique visitors, referrers, devices, events).
- **Content & GitHub** — authenticated editing of the public portfolio content, and live-style repo stats.

Everything is editable: create a lead, move a stage, draft and "send" an email —
the changes persist in your browser and reset when you clear site data.

## How the demo works

The production app is a **Django + DRF backend** with a **React + Vite** frontend.
For this public demo the React app is byte-for-byte the same, but a small mock
layer answers every API call locally instead of over the network:

```
src/demo/seed.js         fictional dataset (leads, emails, tasks, analytics, …)
src/demo/store.js        per-visitor state, persisted to localStorage
src/demo/mockAdapter.js  an axios adapter reproducing every REST endpoint + shape
src/api.js               wires the adapter in (adapter: mockAdapter)
```

Because the mock reproduces the real DRF response shapes — including computed
fields like `stage_display`, `activity_count`, `tag_list` and the pipeline/
analytics aggregates — none of the UI code had to change.

**No real data.** Every lead, recruiter, company and email here is invented. There
is no backend, nothing is sent, and no personal contact details are included.

## Tech

React 19 · Vite · Tailwind CSS · React Router · Recharts · axios (custom adapter).

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL, go to `/dashboard/login`, and sign in with `demo` / `demo`.

## Deploy (free, public link)

1. Push this repo to GitHub.
2. On [Vercel](https://vercel.com), **New Project** → import the repo.
3. Framework preset **Vite**, build command `npm run build`, output `dist` (auto-detected). No environment variables needed.
4. Deploy — you get a public `*.vercel.app` URL. `vercel.json` already rewrites all routes to `index.html` so deep links like `/dashboard/leads` work.

## Reset the demo

Clear the site's storage in your browser (or the `crm_demo_db_v1` localStorage key)
to restore the original sample data.
