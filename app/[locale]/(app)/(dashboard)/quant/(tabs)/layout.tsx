"use client";

import { useTranslations } from "next-intl";

import RouteTabs from "@/components/RouteTabs";

const QuantTabsLayout = ({ children }: { children: React.ReactNode }) => {
  const tQuant = useTranslations("quant");

  return (
    <>
      <RouteTabs
        ariaLabel={tQuant("label")}
        tabs={[{ path: "/quant/market" }, { path: "/quant/settings" }]}
      />
      {children}
    </>
  );
};

export default QuantTabsLayout;
