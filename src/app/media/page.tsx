import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { mediaTitleData } from "@/data/titleBlockPage";
import { FC } from "react";




const MediaPage: FC = () => {
    return (
        <>
            <Breadcrumbs />
            <TitleBlockPage props={mediaTitleData}/>
        </>
    )
}

export default MediaPage