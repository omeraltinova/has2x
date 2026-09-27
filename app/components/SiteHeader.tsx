import { Clock3 } from "lucide-react";
import Link from "next/link";
import type { ProviderKey } from "@/lib/services";
import { ThemeSelector } from "@/app/components/ThemeSelector";
import { ProviderNavigation } from "@/app/components/ProviderNavigation";

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

      <ProviderNavigation activeProvider={activeProvider} />

      <div className="site-intro">
        <div key={activeProvider ?? "overview"}>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </header>
  );
}
