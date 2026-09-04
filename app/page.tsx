import { Hero } from "@/components/home/Hero";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturedResearch } from "@/components/home/FeaturedResearch";
import { LatestNews } from "@/components/home/LatestNews";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsSection />
      <FeaturedResearch />
      <LatestNews />
    </>
  );
}
