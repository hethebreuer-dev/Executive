import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceTemplate } from "@/components/ServiceTemplate";
import { SERVICES } from "@/lib/content";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata(props: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `${service.title} | Executive Outdoor Solutions`,
    description: service.heroDesc,
  };
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();

  return <ServiceTemplate service={service} />;
}
