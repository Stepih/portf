import Breadcrumbs from "@/components/breadCrumb/BreadCrumb";
import TitleBlockPage from "@/components/title-block-page/TitleBlockPage";
import { FC } from "react";

const MediaPage: FC = () => {
    return (
        <>
            <Breadcrumbs />
            <TitleBlockPage props={{title: "popup", description: "Страница попапа в разработке"}}/>
        </>
    )
}

export default MediaPage