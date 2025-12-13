import SectionPageView from "@/components/SectionPageView";

type SectionRouteProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function SectionRoutePage({ params }: SectionRouteProps) {
  const activeSection = decodeURIComponent((await params).section);
  return <SectionPageView section={activeSection} />;
}
