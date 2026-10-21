import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { FC } from "react";
import LeadForm from "./components/lead-form/LeadForm";
import { popupTitleData } from "@/data/titleBlockPage";
import { Metadata } from "next";
import { baseOpenGraph } from "@/data/metadata";

import s from "./page.module.scss";

export const metadata: Metadata = {
    title: "Обсудить проект",
    description: popupTitleData.description,
    
    openGraph: {
        ...baseOpenGraph,
        title: 'Обсудить проект',
        description: popupTitleData.description,
    },
    robots: {
        index: false,
        follow: false
    },
    
};

const PopupPage: FC = () => {
    return (
        <>
            <Breadcrumbs />
            <TitleBlockPage props={popupTitleData}/>

            <LeadForm className={s.form} />
        </>
    )
}

export default PopupPage