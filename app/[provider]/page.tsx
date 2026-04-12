import { PROVIDERS, type ProviderKey } from "@/lib/services";
import { ProviderPageClient } from "./ProviderPageClient";

// Generate static pages for all providers at build time
export function generateStaticParams() {
  return (Object.keys(PROVIDERS) as ProviderKey[]).map((provider) => ({
    provider,
  }));
}

export const dynamicParams = false; // Only allow pre-generated providers

export default async function ProviderPage({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  return <ProviderPageClient providerKey={provider as ProviderKey} />;
}