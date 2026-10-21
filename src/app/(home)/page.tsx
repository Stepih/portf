import Hero from "./components/hero/Hero";
import IndustryChips from "./components/industries/IndustryChips";
import HomeCases from "./components/cases/HomeCases";
import Services from "./components/services/Services";
import Steps from "./components/steps/Steps";
import Reasons from "./components/reasons/Reasons";
import Faq from "./components/faq/Faq";
import Contact from "./components/contact/Contact";
import More from "./components/more/More";

export default function Home() {
  return (
    <>
      <Hero />
      <IndustryChips />
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
