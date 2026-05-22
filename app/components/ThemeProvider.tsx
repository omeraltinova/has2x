"use client";

import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `!function(){try{var t=localStorage.getItem("theme");if(t){var p=JSON.parse(t);document.documentElement.classList.toggle("dark","dark"===p)}else document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}}();`,
        }}
      />
      {children}
    </>
  );
}
