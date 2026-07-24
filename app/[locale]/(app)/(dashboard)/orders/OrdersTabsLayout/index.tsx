"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Link, usePathname } from "@/i18n/navigation";

import {
  ReceiptLong,
  ViewKanban,
  type SvgIconComponent,
} from "@mui/icons-material";
import { Tab, Tabs } from "@mui/material";

import { getHref } from "@/utils/href";

interface OrdersTabsLayoutProps {
  children: React.ReactNode;
}

const OrdersTabsLayout = ({ children }: OrdersTabsLayoutProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const organization = searchParams.get("organization");

  const tOrders = useTranslations("orders");

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    query?: Record<string, string>;
    value: string;
  }[] = [
    {
      Icon: ReceiptLong,
      label: tOrders("list.label"),
      query: { page: "1", pageSize: "10" },
      value: "/orders/list",
    },
    {
      Icon: ViewKanban,
      label: tOrders("board.title"),
      value: "/orders/board",
    },
  ];

  const currentTab =
    tabs.find(({ value }) => pathname.startsWith(value))?.value ??
    tabs[0].value;

  return (
    <>
      <Tabs
        aria-label="orders tabs"
        scrollButtons="auto"
        value={currentTab}
        variant="scrollable"
      >
        {tabs.map(({ Icon, label, query, value }) => (
          <Tab
            component={Link}
            href={getHref(value, { organization, ...query })}
            icon={<Icon fontSize="small" />}
            iconPosition="start"
            key={value}
            label={label}
            value={value}
          />
        ))}
      </Tabs>
      {children}
    </>
  );
};

export default OrdersTabsLayout;
