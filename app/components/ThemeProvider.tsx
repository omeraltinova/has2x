"use client";

import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
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
