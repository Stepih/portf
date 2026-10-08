import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { FC } from "react";
import Popup from "./components/popup/Popup";
import { popupTitleData } from "@/data/titleBlockPage";
import { Metadata } from "next";
import { baseOpenGraph } from "@/data/metadata";

export const metadata: Metadata = {
    title: "Оставить заявку",
    description: popupTitleData.description,
    
    openGraph: {
        ...baseOpenGraph,
        title: 'Оставить заявку',
        description: popupTitleData.description,
    },
    robots: {
        index: false,
        follow: false
    },
    
};

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