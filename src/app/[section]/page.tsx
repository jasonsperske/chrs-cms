"use client";

import SectionPageView from "@/components/SectionPageView";

type SectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function SectionPage({ params }: SectionPageProps) {
  const activeSection = decodeURIComponent((await params).section);
  return <SectionPageView section={activeSection} />;
}
