"use client";

import { useEffect, type ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.sizes = "any";

    const updateIcon = () => {
      const styles = getComputedStyle(root);
      const background = styles.getPropertyValue("--background").trim() || "#0f0f12";
      const accent = styles.getPropertyValue("--accent-text").trim() || "#34d399";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${background}"/><text x="16" y="22" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="16" fill="${accent}">2x</text></svg>`;
      icon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    };

    updateIcon();
    document.head.appendChild(icon);

    const themeObserver = new MutationObserver(updateIcon);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });

    const keepIconLast = () => {
      const icons = document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]');
      if (icons[icons.length - 1] !== icon) document.head.appendChild(icon);
    };
    const headObserver = new MutationObserver(keepIconLast);
    headObserver.observe(document.head, { childList: true });
    keepIconLast();

    return () => {
      themeObserver.disconnect();
      headObserver.disconnect();
      icon.remove();
    };
  }, []);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `!function(){try{var m=localStorage.getItem("theme-mode"),p=localStorage.getItem("theme-palette"),o=localStorage.getItem("theme");if(o&&!m)try{var v=JSON.parse(o);("dark"===v||"light"===v)&&(m=JSON.stringify(v))}catch(e){}var d=m?JSON.parse(m):"dark",a=p?JSON.parse(p):"emerald";document.documentElement.classList.toggle("dark","dark"===d),document.documentElement.setAttribute("data-theme",a)}catch(e){document.documentElement.classList.add("dark"),document.documentElement.setAttribute("data-theme","emerald")}}();`,
        }}
      />
      {children}
    </>
  );
}
