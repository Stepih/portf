import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import ButtonList from "./components/ButtonList";
import { homeTitleData } from "@/data/titleBlockPage";

export default function Home() {
  return (
    <>
      <TitleBlockPage props={homeTitleData}/>
      <ButtonList />
    </>
  );
}
