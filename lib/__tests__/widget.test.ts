import { describe, expect, it } from "vitest";
import { makeWidgetEmbed, makeWidgetUrl, readWidgetAppearance } from "../widget";

describe("widget URL and embed", () => {
  it("keeps older widget URLs usable and falls back from invalid appearance values", () => {
    expect(readWidgetAppearance(new URLSearchParams("widget=true&services=glm53"))).toEqual({
      theme: "emerald", mode: "dark", layout: "cards",
    });
    expect(readWidgetAppearance(new URLSearchParams("theme=unknown&mode=auto&layout=other"))).toEqual({
      theme: "emerald", mode: "dark", layout: "cards",
    });
  });

  it("puts every appearance choice in the widget URL", () => {
    const url = new URL(makeWidgetUrl("https://has2x.vercel.app", ["glm53", "deepseek"], "ocean", "light", "rows"));
    expect(Object.fromEntries(url.searchParams)).toEqual({
      widget: "true", services: "glm53,deepseek", theme: "ocean", mode: "light", layout: "rows",
    });
  });

  it("resizes only from its own iframe at the expected origin", () => {
    const url = makeWidgetUrl("https://has2x.vercel.app", ["glm53"], "emerald", "dark", "cards");
    const html = makeWidgetEmbed(url, "420px");
    expect(html).toContain("&amp;services=");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const frame = container.querySelector("iframe")!;
    const script = container.querySelector("script")!;
    const currentScript = Object.getOwnPropertyDescriptor(document, "currentScript");
    Object.defineProperty(document, "currentScript", { configurable: true, value: script });

    try {
      new Function(script.textContent ?? "")();
      expect(frame.style.maxWidth).toBe("420px");

      const sendHeight = (origin: string, height: number) => {
        window.dispatchEvent(new MessageEvent("message", {
          source: frame.contentWindow,
          origin,
          data: { type: "has2x:resize", height },
        }));
      };

      sendHeight("https://other.example", 300);
      expect(frame.style.height).toBe("840px");
      sendHeight("https://has2x.vercel.app", 298.4);
      expect(frame.style.height).toBe("299px");
      sendHeight("https://has2x.vercel.app", 9000);
      expect(frame.style.height).toBe("299px");
    } finally {
      if (currentScript) Object.defineProperty(document, "currentScript", currentScript);
      else Reflect.deleteProperty(document, "currentScript");
      container.remove();
    }
  });
});
