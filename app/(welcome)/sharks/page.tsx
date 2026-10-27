import type { Metadata } from "next";
import { getPublicProgram, getPublishedStories } from "@/lib/sharks/public";
import { acceptingApplications } from "@/lib/sharks/workflow";
import SharksHero from "../_components/sharks/SharksHero";
import Manifesto from "../_components/sharks/Manifesto";
import MeetTheSharks from "../_components/sharks/MeetTheSharks";
import Tracks from "../_components/sharks/Tracks";
import HowItWorks from "../_components/sharks/HowItWorks";
import Plainly from "../_components/sharks/Plainly";
import SharksCTA from "../_components/sharks/SharksCTA";

export const metadata: Metadata = {
  title: "Casho Sharks — كاشو",
  description:
    "Casho Sharks برنامج بيختار مشاريع واعدة من تجار كاشو ويساعدها تاخد خطوتها الجاية بالأدوات والخبرة والفرص المتاحة جوه منظومة كاشو.",
  alternates: { canonical: "/sharks" },
  openGraph: {
    title: "Casho Sharks",
    description: "Some businesses deserve more than a chance. A support program for promising businesses building on Casho.",
    type: "website",
  },
};

// Published stories change rarely; publish/unpublish revalidates this path.
export const revalidate = 300;

export default async function SharksPage() {
  const [stories, program] = await Promise.all([getPublishedStories(), getPublicProgram()]);
  const open = acceptingApplications(program);

  // Light / dark alternation, one idea per section (same system as the home page).
  return (
    <div className="al">
      <SharksHero open={open} />
      <Manifesto />
      <MeetTheSharks open={open} stories={stories} />
      <Tracks program={program} />
      <HowItWorks />
      <Plainly />
      <SharksCTA open={open} />
    </div>
  );
}
