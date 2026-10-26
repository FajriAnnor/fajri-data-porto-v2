import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { StatsStrip } from "@/components/sections/StatsStrip";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Capabilities } from "@/components/sections/Capabilities";
import { DataProcess } from "@/components/sections/DataProcess";
import { ContactBanner } from "@/components/sections/ContactBanner";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <div className="page-flow container">
          <StatsStrip />
          <FeaturedWork />
          <Capabilities />
          <DataProcess />
          <ContactBanner />
        </div>
      </main>
      <Footer />
    </>
  );
}
