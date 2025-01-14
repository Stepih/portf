import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { FC } from "react";
import Popup from "./components/popup/Popup";
import { popupTitleData } from "@/data/titleBlockPage";

const MediaPage: FC = () => {
    return (
        <>
            <Breadcrumbs />
            <TitleBlockPage props={popupTitleData}/>

            <Popup />
        </>
    )
}

export default MediaPage