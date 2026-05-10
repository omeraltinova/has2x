# has2x — AI Usage Multiplier Tracker

Track AI service usage multipliers in real time. has2x shows whether Claude Code, Codex, and GLM models are currently in a normal, bonus, or peak usage window based on your local timezone.

## Features

- **Real-time Status Cards** — See the current multiplier or limit status for each service.
- **Best Time Recommendation** — Highlight services that are currently at their best rate.
- **Visual Timelines** — View local 24-hour peak/off-peak windows.
- **Live Countdowns** — See when the next rate change starts.
- **Local Timezone Support** — Browser timezone is detected with `Intl.DateTimeFormat()`.
- **Dark/Light Mode** — Theme preference is saved in `localStorage`.
- **Service Filter** — Choose which services are visible on the dashboard.
- **Provider Pages** — Dedicated pages for `/claude`, `/codex`, and `/glm`.
- **Widget Mode** — Minimal embeddable UI via URL parameters.
- **Client-Side Only** — No API routes or external server calls for status calculations.

## Supported Services

| Service | Peak Hours | Current Logic | Notes |
|---------|------------|---------------|-------|
| **Claude Code** | None for Pro/Max | Peak-hour limit reduction removed; normal five-hour limits all day | Claude Code only. Claude chat and API limits may differ. |
| **Codex** | None | 2× active 24/7 until May 31, 2026 | Applies to Pro subscriptions according to the app copy. |
| **GLM-5.1** | 2PM-6PM Beijing Time | Peak: 3× usage; off-peak: 1× until Apr 30, 2026, then 2× | Local time is calculated in the browser. |
| **GLM-5** | 2PM-6PM Beijing Time | Peak: 3× usage; off-peak: 2× usage | Best used off-peak when possible. |
| **GLM-5-Turbo** | 2PM-6PM Beijing Time | Peak: 3× usage; off-peak: 1× until Apr 30, 2026, then 2× | Local time is calculated in the browser. |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with all selected services. |
| `/claude` | Claude Code provider view. |
| `/codex` | Codex-only provider view. |
| `/glm` | GLM provider view with GLM-5.1, GLM-5, and GLM-5-Turbo. |

## URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `widget` | `?widget=true` | Shows the compact embeddable widget UI. |
| `services` | `?services=codex,glm5` | Shows only the selected service keys. |

Supported service keys:

```text
claude,codex,glm51,glm5,glm5Turbo
```

Example:

```text
/?widget=true&services=codex,glm5,glm5Turbo
```

## Embedding

The app can generate an iframe snippet from the **Get Widget** button on the dashboard. A widget URL looks like this:

```html
<iframe src="https://has2x.vercel.app/?widget=true&services=codex,glm5" width="100%" height="400px" frameborder="0"></iframe>
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

```bash
npm run dev      # Start the development server
npm run build    # Build for production
npm run start    # Start the production server
npm run lint     # Run ESLint
```

## Tech Stack

- [Next.js 16](https://nextjs.org) — React framework
- [React 19](https://react.dev) — UI library
- [Tailwind CSS 4](https://tailwindcss.com) — Styling
- [TypeScript](https://www.typescriptlang.org) — Type safety
- [Lucide React](https://lucide.dev) — Widget icons

## How It Works

All status calculations run in the browser:

1. Detect the user's local timezone with `Intl.DateTimeFormat()`.
2. Convert source peak windows into local time where a service still has peak windows.
3. Calculate each service's current status, multiplier, and next change time.
4. Use the `isBonus` flag to recommend the best services to use now.

No external API calls are required for the dynamic status display.

## Disclaimer

Service limits, promotions, and peak windows can change. Always verify important usage details with the official service provider.

## License

MIT
