# has2x — AI Usage Multiplier Tracker

A real-time tracker for AI service usage multipliers. Monitor when Claude, Codex, and GLM offer bonus rates based on your local timezone.

## Features

- **Real-time Status Cards** — See current multiplier status for each service
- **Best Time Recommendation** — Instantly know which services are at bonus rates right now
- **Visual Timelines** — Interactive 24-hour peak hour visualizations
- **Live Countdowns** — Time until next rate change
- **Local Timezone Support** — All times converted to your browser's timezone
- **Dark/Light Mode** — Toggle between themes, saved to localStorage
- **Widget Mode** — Minimal UI for embedding via `?widget=true`
- **Service Filter** — Show only the services you care about
- **100% Client-Side** — No server calls, no API routes, all calculations run in your browser

## Supported Services

| Service | Peak Hours | Off-Peak Rate | Notes |
|---------|------------|---------------|-------|
| **Claude** | 8AM–2PM ET (weekdays) | 2× | Promotion until March 27, 2026 |
| **Codex** | None | 2× | 24/7 bonus until April 2, 2026 |
| **GLM-5** | 2PM–6PM Beijing Time | 2× | Peak: 3× consumption |
| **GLM-5-Turbo** | 2PM–6PM Beijing Time | 1× | Off-peak promo until April 30, 2026 |

## URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `widget` | `?widget=true` | Minimal UI without header/footer/theme toggle |
| `services` | `?services=codex,glm5` | Show only specified services |

Combine parameters: `?widget=true&services=codex,glm5`

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tech Stack

- [Next.js 16](https://nextjs.org) — React framework
- [React 19](https://react.dev) — UI library
- [Tailwind CSS 4](https://tailwindcss.com) — Styling
- [TypeScript](https://www.typescriptlang.org) — Type safety

## How It Works

All calculations run client-side:

1. **Timezone Detection** — Uses `Intl.DateTimeFormat()` to detect your local timezone
2. **Peak Hour Calculation** — Converts source timezones (ET, Beijing) to your local time
3. **Status Computation** — Determines current multiplier based on time and day
4. **Best Time Logic** — Uses `isBonus` flag to recommend services with bonus rates

No external API calls, no server-side rendering for dynamic content.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
