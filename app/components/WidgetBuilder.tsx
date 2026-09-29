"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clipboard, X } from "lucide-react";
import { makeWidgetEmbed, makeWidgetUrl, type WidgetLayout, type WidgetMode, type WidgetPalette } from "@/lib/widget";

const SERVICE_OPTIONS = [
  { key: "glm53", label: "GLM-5.3" },
  { key: "glm53Flash", label: "GLM-5.3-Flash" },
  { key: "deepseek", label: "DeepSeek API" },
  { key: "xiaomi", label: "Xiaomi" },
] as const;

type ServiceKey = (typeof SERVICE_OPTIONS)[number]["key"];

export function WidgetBuilder({ initialServices, onClose }: { initialServices: ServiceKey[]; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [services, setServices] = useState<ServiceKey[]>(initialServices.length ? initialServices : ["glm53"]);
  const [theme, setTheme] = useState<WidgetPalette>("emerald");
  const [mode, setMode] = useState<WidgetMode>("dark");
  const [layout, setLayout] = useState<WidgetLayout>("cards");
  const [maxWidth, setMaxWidth] = useState("none");
  const [previewWidth, setPreviewWidth] = useState("100%");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const origin = typeof window === "undefined" ? "https://has2x.vercel.app" : window.location.origin;
  const url = useMemo(() => makeWidgetUrl(origin, services, theme, mode, layout), [origin, services, theme, mode, layout]);
  const embed = useMemo(() => makeWidgetEmbed(url, maxWidth), [url, maxWidth]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const receiveHeight = (event: MessageEvent) => {
      if (event.source !== previewRef.current?.contentWindow || event.origin !== origin || event.data?.type !== "has2x:resize") return;
      const height = Number(event.data.height);
      if (Number.isFinite(height) && height > 0 && height < 5000 && previewRef.current) {
        previewRef.current.style.height = `${Math.ceil(height)}px`;
      }
    };
    window.addEventListener("message", receiveHeight);
    return () => window.removeEventListener("message", receiveHeight);
  }, [origin]);

  const toggleService = (key: ServiceKey) => {
    setServices((current) => current.includes(key)
      ? current.length > 1 ? current.filter((value) => value !== key) : current
      : SERVICE_OPTIONS.map((option) => option.key).filter((value) => current.includes(value) || value === key));
  };

  const copyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embed);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  return (
    <dialog ref={dialogRef} className="widget-modal" aria-labelledby="widget-modal-title" onClose={onClose}>
      <header className="widget-builder-header">
        <div>
          <h2 id="widget-modal-title">Embed widget</h2>
          <p>Choose the services and appearance, then copy the code.</p>
        </div>
        <button className="widget-modal-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close widget dialog"><X size={18} aria-hidden="true" /></button>
      </header>

      <div className="widget-builder-body">
        <div className="widget-modal-controls">
          <fieldset className="widget-builder-fieldset">
            <legend>Services</legend>
            <div className="widget-service-options">
              {SERVICE_OPTIONS.map(({ key, label }) => (
                <label key={key} className="widget-service-option">
                  <input type="checkbox" checked={services.includes(key)} disabled={services.length === 1 && services.includes(key)} onChange={() => toggleService(key)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="widget-builder-fields">
            <label className="widget-builder-field">Palette
              <select value={theme} onChange={(event) => setTheme(event.target.value as WidgetPalette)}>
                <option value="emerald">Emerald</option><option value="sunset">Sunset</option><option value="ocean">Ocean</option><option value="cyberpunk">Cyberpunk</option>
              </select>
            </label>
            <label className="widget-builder-field">Mode
              <select value={mode} onChange={(event) => setMode(event.target.value as WidgetMode)}>
                <option value="dark">Dark</option><option value="light">Light</option>
              </select>
            </label>
            <label className="widget-builder-field">Layout
              <select value={layout} onChange={(event) => setLayout(event.target.value as WidgetLayout)}>
                <option value="cards">Cards</option><option value="rows">Compact rows</option>
              </select>
            </label>
            <label className="widget-builder-field">Maximum width
              <select value={maxWidth} onChange={(event) => setMaxWidth(event.target.value)}>
                <option value="none">Fill container</option><option value="420px">420 px</option><option value="760px">760 px</option><option value="1120px">1120 px</option>
              </select>
            </label>
          </div>

          <div className="widget-code-heading">
            <div><h3>Embed code</h3><p>The frame adjusts its height to fit the cards.</p></div>
            <button type="button" className="widget-copy-button" onClick={copyEmbed}>{copied ? <Check size={15} aria-hidden="true" /> : <Clipboard size={15} aria-hidden="true" />}{copied ? "Copied" : "Copy code"}</button>
          </div>
          <pre className="widget-embed-code"><code>{embed}</code></pre>
          {copyError && <p className="widget-copy-error" role="alert">Could not copy automatically. Select and copy the code above.</p>}
          <p className="widget-embed-note">If your site removes scripts, set the iframe height manually. The widget still works.</p>
        </div>

        <div className="widget-modal-preview">
          <div className="widget-preview-heading">
            <div><h3>Preview</h3><p>Check how it fits before embedding.</p></div>
            <div className="widget-preview-sizes" role="group" aria-label="Preview width">
              {[{ label: "320 px", width: "320px" }, { label: "640 px", width: "640px" }, { label: "Fill", width: "100%" }].map(({ label, width }) => (
                <button key={label} type="button" className={previewWidth === width ? "is-active" : ""} aria-pressed={previewWidth === width} onClick={() => setPreviewWidth(width)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="widget-preview-stage">
            <iframe key={url} ref={previewRef} src={url} title="Widget preview" className="widget-preview-frame" style={{ width: previewWidth }} />
          </div>
          <p className="widget-preview-caption">{services.length} {services.length === 1 ? "service" : "services"} · {layout === "cards" ? "Cards" : "Compact rows"} · {mode === "dark" ? "Dark" : "Light"} {theme}. Scroll sideways for fixed widths that exceed this panel.</p>
        </div>
      </div>
    </dialog>
  );
}
