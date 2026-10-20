import Hero from "./components/hero/Hero";
import IndustryChips from "./components/industries/IndustryChips";
import HomeCases from "./components/cases/HomeCases";
import Services from "./components/services/Services";
import Steps from "./components/steps/Steps";
import Reasons from "./components/reasons/Reasons";
import Faq from "./components/faq/Faq";
import ButtonList from "./components/ButtonList";

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
      <ButtonList />
    </>
  );
}
