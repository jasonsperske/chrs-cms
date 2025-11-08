"use client";

import SectionPageView from "@/components/SectionPageView";

type SectionPageProps = {
  params: {
    section: string;
  };
};

export default function SectionPage({ params }: SectionPageProps) {
  const activeSection = decodeURIComponent(params.section);
  return <SectionPageView section={activeSection} />;
}
