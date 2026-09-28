# has2x — AI Usage Multiplier Tracker

Track GLM, DeepSeek API, and Xiaomi usage rates in real time. has2x shows the current peak or off-peak rate and converts schedules to your local timezone.

## Features

- **Real-time Status Cards** — See the current multiplier or limit status for each service.
- **Best Time Recommendation** — Highlight services that are currently at their best rate.
- **Visual Timelines** — View local 24-hour peak/off-peak windows.
- **Live Countdowns** — See when the next rate change starts.
- **Local Timezone Support** — Browser timezone is detected with `Intl.DateTimeFormat()`.
- **Dark/Light Mode** — Theme preference is saved in `localStorage`.
- **Service Filter** — Choose which services are visible on the dashboard.
- **Provider Pages** — Dedicated pages for `/glm`, `/deepseek`, and `/xiaomi`.
- **Widget Mode** — Minimal embeddable UI via URL parameters.
- **Client-Side Only** — No API routes or external server calls for status calculations.

## Supported Services

| Service | Peak Hours | Current Logic | Notes |
|---------|------------|---------------|-------|
| **GLM-5.3** | Monday–Friday, 14:00–18:00 SGT (UTC+8) | Peak: 3× quota; off-peak: 1× | Sep 25–Oct 7, 2026: peak hours use the off-peak rate. |
| **GLM-5.3-Flash** | Monday–Friday, 14:00–18:00 SGT (UTC+8) | Peak: 1.2× quota; off-peak: 0.4× | Sep 25–Oct 7, 2026: peak hours use the off-peak rate. |
| **DeepSeek API** | Monday–Friday, 09:00–12:00 and 14:00–18:00 SGT (UTC+8) | Peak prices are 2× off-peak prices | Chinese public holidays are off-peak; the tracker does not check holiday dates. See [DeepSeek's official pricing page](https://api-docs.deepseek.com/quick_start/pricing/). |
| **Xiaomi** | 16:00–24:00 UTC | 0.8× consumption during the bonus window; 1× otherwise | Local time is calculated in the browser. |

The [GLM Coding Plan promotion](https://docs.z.ai/devpack/overview) applies off-peak credit usage throughout September 25–October 7, 2026. The tracker uses Singapore time for the cutoff: October 8, 00:00 SGT (October 7, 16:00 UTC). The regular GLM peak schedule resumes automatically after that point. This promotion applies to Coding Plan credit consumption, not the subscription price.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with all selected services. |
| `/glm` | GLM provider view with GLM-5.3 and GLM-5.3-Flash. |
| `/deepseek` | DeepSeek API peak and off-peak pricing. |
| `/xiaomi` | Xiaomi token plan. |

## URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `widget` | `?widget=true` | Shows the compact embeddable widget UI. |
| `services` | `?services=glm53,deepseek` | Shows only the selected service keys. |

Supported service keys:

```text
glm53,glm53Flash,deepseek,xiaomi
```

Example:

```text
/?widget=true&services=glm53,deepseek
```

## Embedding

The app can generate an iframe snippet from the **Get Widget** button on the dashboard. A widget URL looks like this:

```html
<iframe src="https://has2x.vercel.app/?widget=true&services=glm53,deepseek" width="100%" height="400px" frameborder="0"></iframe>
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
2. Convert peak windows from Singapore time to local time.
3. Calculate each service's current status, multiplier, and next change time.
4. Use the `isBonus` flag to recommend the best services to use now.

No external API calls are required for the dynamic status display.

## Disclaimer

The above figures are estimates. Actual available usage may vary depending on project complexity, repository size, and whether auto-accept is enabled. Service rates and peak windows can change, so verify important details with the official provider.

## License

MIT
