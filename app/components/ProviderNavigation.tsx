import Link from "next/link";
import { PROVIDERS, type ProviderKey } from "@/lib/services";

export function ProviderNavigation({ activeProvider }: { activeProvider: ProviderKey | null }) {
  return (
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
  );
}
