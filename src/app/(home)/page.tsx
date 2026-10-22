import HeroExpand from "./components/hero/HeroExpand";
import HomeCases from "./components/cases/HomeCases";
import Services from "./components/services/Services";
import Steps from "./components/steps/Steps";
import Reasons from "./components/reasons/Reasons";
import Faq from "./components/faq/Faq";
import Contact from "./components/contact/Contact";
import More from "./components/more/More";
import { portfolioIndustries, portfolioWorks } from "@/data/portfolio";
import { industryCounts } from "@/scripts/portfolioIndustry";

export default function Home() {
  const chips = industryCounts(portfolioWorks, portfolioIndustries)
    .map(({ industry, count }) => ({ id: industry.id, label: industry.label, count }));

  return (
    <>
      <HeroExpand chips={chips} worksCount={portfolioWorks.length} />
      <HomeCases />
      <Services />
      <Steps />
      <Reasons />
      <Faq />
      <Contact />
      <More />
    </>
  );
}
