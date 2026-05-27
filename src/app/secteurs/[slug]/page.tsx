import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SECTORS, getSectorBySlug } from "@/config/sectors";
import { SectorLanding } from "@/components/landing/sector-landing";

// Génération statique — une page par secteur
export function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sector = getSectorBySlug(slug);
  if (!sector) return {};

  return {
    title:       sector.marketing.seoTitle,
    description: sector.marketing.seoDescription,
    keywords:    sector.marketing.keywords.join(", "),
    openGraph: {
      title:       sector.marketing.seoTitle,
      description: sector.marketing.seoDescription,
      type:        "website",
    },
  };
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sector = getSectorBySlug(slug);

  if (!sector) notFound();

  return <SectorLanding sector={sector} />;
}
