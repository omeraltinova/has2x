export const WIDGET_PALETTES = ["emerald", "sunset", "ocean", "cyberpunk"] as const;
export const WIDGET_MODES = ["dark", "light"] as const;
export const WIDGET_LAYOUTS = ["cards", "rows"] as const;

export type WidgetPalette = (typeof WIDGET_PALETTES)[number];
export type WidgetMode = (typeof WIDGET_MODES)[number];
export type WidgetLayout = (typeof WIDGET_LAYOUTS)[number];

export function readWidgetAppearance(params: URLSearchParams) {
  const theme = params.get("theme");
  const mode = params.get("mode");
  const layout = params.get("layout");

  return {
    theme: WIDGET_PALETTES.find((value) => value === theme) ?? "emerald",
    mode: WIDGET_MODES.find((value) => value === mode) ?? "dark",
    layout: WIDGET_LAYOUTS.find((value) => value === layout) ?? "cards",
  };
}

export function makeWidgetUrl(origin: string, services: string[], theme: WidgetPalette, mode: WidgetMode, layout: WidgetLayout) {
  const url = new URL("/", origin);
  url.searchParams.set("widget", "true");
  url.searchParams.set("services", services.join(","));
  url.searchParams.set("theme", theme);
  url.searchParams.set("mode", mode);
  url.searchParams.set("layout", layout);
  return url.toString();
}

export function makeWidgetEmbed(url: string, maxWidth: string) {
  const safeUrl = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  const widthStyle = maxWidth === "none" ? "" : `max-width:${maxWidth};`;
  return `<iframe src="${safeUrl}" title="has2x usage rates" loading="lazy" style="display:block;width:100%;${widthStyle}height:840px;border:0"></iframe>
<script>
(() => {
  const frame = document.currentScript.previousElementSibling;
  const origin = new URL(frame.src).origin;
  window.addEventListener("message", (event) => {
    if (event.source !== frame.contentWindow || event.origin !== origin || event.data?.type !== "has2x:resize") return;
    const height = Number(event.data.height);
    if (Number.isFinite(height) && height > 0 && height < 5000) frame.style.height = Math.ceil(height) + "px";
  });
})();
</script>`;
}
