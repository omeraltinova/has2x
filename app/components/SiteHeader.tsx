import Link from "next/link";
import { Clock3 } from "lucide-react";
import { PROVIDERS, type ProviderKey } from "@/lib/services";
import { ThemeSelector } from "@/app/components/ThemeSelector";

type SiteHeaderProps = {
  activeProvider: ProviderKey | null;
  title: string;
  description: string;
  timezone: string;
};

export function SiteHeader({ activeProvider, title, description, timezone }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-topbar">
        <div className="site-brand-lockup">
          <Link href="/" className="site-brand" aria-label="has2x overview">
            has<span className="site-brand-accent">2x</span>
          </Link>
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

      <nav className="site-navigation" aria-label="Main navigation">
        <Link href="/" className="site-nav-link" aria-current={activeProvider === null ? "page" : undefined}>
          Overview
        </Link>
        {(Object.entries(PROVIDERS) as [ProviderKey, typeof PROVIDERS[ProviderKey]][]).map(([key, provider]) => (
          <Link
            key={key}
            href={`/${key}`}
            className="site-nav-link"
            aria-current={activeProvider === key ? "page" : undefined}
          >
            {provider.name}
          </Link>
        ))}
      </nav>

      <div className="site-intro">
        <div key={activeProvider ?? "overview"}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </header>
  );
}
