import { Clock3 } from "lucide-react";
import { PROVIDERS, type ProviderKey } from "@/lib/services";
import { ThemeSelector } from "@/app/components/ThemeSelector";
import { OverviewLink, ProviderNavigation } from "@/app/components/ProviderNavigation";

type SiteHeaderProps = {
  activeProvider: ProviderKey | null;
  title: string;
  description: string;
  timezone: string;
  outgoingProvider?: ProviderKey | null;
};

export function SiteHeader({ activeProvider, title, description, timezone, outgoingProvider = null }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-topbar">
        <div className="site-brand-lockup">
          <OverviewLink className="site-brand" current={false} ariaLabel="has2x overview">
            has<span className="site-brand-accent">2x</span>
          </OverviewLink>
          <span className="site-brand-context">AI service usage</span>
        </div>

        <div className="site-header-controls">
          <span className="site-timezone">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            <span>Local time · {timezone}</span>
          </span>
          <ThemeSelector />
        </div>
      </div>

      <ProviderNavigation activeProvider={activeProvider} />

      <div className={`site-intro${outgoingProvider ? " site-intro--transitioning" : ""}`}>
        {outgoingProvider && (
          <div
            key={`outgoing-${outgoingProvider}`}
            className="site-intro-content site-intro-content--exit"
            aria-hidden="true"
            inert
          >
            <h1>{PROVIDERS[outgoingProvider].name}</h1>
            <p>{PROVIDERS[outgoingProvider].description}</p>
          </div>
        )}
        <div key={activeProvider ?? "overview"} className="site-intro-content site-intro-content--enter">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </header>
  );
}
