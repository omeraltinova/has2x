"use client";

import Link from "next/link";
import { PROVIDERS, type ProviderKey } from "@/lib/services";
import { useDashboardState } from "@/app/components/DashboardStateProvider";

export function OverviewLink({
  className,
  current,
  ariaLabel,
  children,
}: {
  className: string;
  current: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const { clearProviderTransition } = useDashboardState();

  return (
    <Link
      href="/"
      className={className}
      aria-current={current ? "page" : undefined}
      aria-label={ariaLabel}
      onNavigate={clearProviderTransition}
    >
      {children}
    </Link>
  );
}

export function ProviderNavigation({ activeProvider }: { activeProvider: ProviderKey | null }) {
  const { beginProviderTransition } = useDashboardState();

  return (
    <nav className="site-navigation" aria-label="Main navigation">
      <OverviewLink className="site-nav-link" current={activeProvider === null}>
        Overview
      </OverviewLink>
      {(Object.entries(PROVIDERS) as [ProviderKey, typeof PROVIDERS[ProviderKey]][]).map(([key, provider]) => (
        <Link
          key={key}
          href={`/${key}`}
          className="site-nav-link"
          aria-current={activeProvider === key ? "page" : undefined}
          onNavigate={() => {
            if (activeProvider) beginProviderTransition(activeProvider, key);
          }}
        >
          {provider.name}
        </Link>
      ))}
    </nav>
  );
}
