"use client";

import { ComponentProps, FC, Suspense } from "react";
import Link from "next/link";

import { usePortfolioIndustry } from "@/hooks/usePortfolioIndustry";
import { withIndustry } from "@/scripts/portfolioIndustry";

type IProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

const IndustryLink: FC<IProps> = ({ href, ...rest }) => {
    const industry = usePortfolioIndustry();
    return <Link href={withIndustry(href, industry?.id ?? null)} {...rest} />
}

// Ссылка внутри портфолио: несёт отрасль из текущего адреса (?for=) дальше, чтобы клиент не выпадал из своей подборки.
// До гидрации статической страницы — обычная ссылка без отрасли
const PortfolioLink: FC<IProps> = (props) => {
    return (
        <Suspense fallback={<Link {...props} />}>
            <IndustryLink {...props} />
        </Suspense>
    )
}

export default PortfolioLink
