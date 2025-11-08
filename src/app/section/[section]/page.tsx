import SectionPageView from "@/components/SectionPageView";

type SectionRouteProps = {
  params: {
    section: string;
  };
};

export default function SectionRoutePage({ params }: SectionRouteProps) {
  const activeSection = decodeURIComponent(params.section);
  return <SectionPageView section={activeSection} />;
}
