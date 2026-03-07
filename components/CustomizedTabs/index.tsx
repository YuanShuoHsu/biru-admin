// https://mui.com/material-ui/react-tabs/#system-VerticalTabs.tsx
// https://github.com/mui/material-ui/issues/10739

"use client";

import dayjs from "dayjs";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import ResponsiveGrid from "./ResponsiveGrid";
import TabPanel from "./TabPanel";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";
import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";
import {
  LATEST,
  NEW_PRODUCT_DAYS,
  TOP_SOLD,
  TOP_SOLD_LIMIT,
} from "@/constants/tab";

import { Stack, Tab, Tabs, useScrollTrigger } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useMenuStore } from "@/providers/menu-store-provider";
import { useOrderSearchStore } from "@/providers/order-search-store-provider";

const HorizontalTabs = styled(Tabs, {
  shouldForwardProp: (prop) => prop !== "trigger",
})<{ trigger: boolean }>(({ theme, trigger }) => ({
  position: "sticky",
  top: APP_BAR_TOOLBAR_HEIGHT,
  transform: trigger
    ? `translateY(-${APP_BAR_TOOLBAR_HEIGHT}px)`
    : "translateY(0)",

  [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
    top: APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
    transform: trigger
      ? `translateY(-${APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE}px)`
      : "translateY(0)",
  },

  [theme.breakpoints.up("sm")]: {
    top: APP_BAR_TOOLBAR_HEIGHT_SM_UP,
    transform: trigger
      ? `translateY(-${APP_BAR_TOOLBAR_HEIGHT_SM_UP}px)`
      : "translateY(0)",
  },

  backgroundColor: theme.vars.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  transition: theme.transitions.create(["background-color", "transform"]),
  zIndex: theme.zIndex.appBar - 1,

  "& .MuiTab-root": {
    transition: theme.transitions.create("color"),
  },
}));

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  "aria-controls": `simple-tabpanel-${index}`,
});

const CustomizedTabs = () => {
  const locale = useLocale();

  const { menus } = useMenuStore((state) => state);

  const { orderSearchText } = useOrderSearchStore((state) => state);
  const searchText = orderSearchText.trim().toLowerCase();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  const tOrder = useTranslations("order");

  const categoryGroups = menus
    .map(({ id, name, items }) => ({
      id,
      label: name[locale],
      items: items.filter(({ isActive }) => isActive),
    }))
    .filter(({ items }) => items.length > 0);

  const allItems = categoryGroups.flatMap(({ items }) => items);

  const topSoldItems = [...allItems]
    .sort((a, b) => b.sold - a.sold)
    .slice(0, TOP_SOLD_LIMIT);

  const topSoldGroups =
    topSoldItems.length > 0
      ? {
          id: TOP_SOLD,
          items: topSoldItems,
          label: tOrder("mode.storeSlug.tableNumber.topSold"),
        }
      : null;

  const latestItems = allItems.filter(
    ({ createdAt }) =>
      dayjs().diff(dayjs(createdAt), "day") <= NEW_PRODUCT_DAYS,
  );

  const latestGroups =
    latestItems.length > 0
      ? {
          id: LATEST,
          items: latestItems,
          label: tOrder("mode.storeSlug.tableNumber.latest"),
        }
      : null;

  const combinedGroups = [
    ...(topSoldGroups ? [topSoldGroups] : []),
    ...(latestGroups ? [latestGroups] : []),
    ...categoryGroups,
  ];

  const filteredGroups = combinedGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(({ name }) =>
        name[locale].toLowerCase().includes(searchText),
      ),
    }))
    .filter(
      ({ items, label }) =>
        label.toLowerCase().includes(searchText) || items.length > 0,
    );

  const [selectedId, setSelectedId] = useState(filteredGroups[0]?.id || "");

  const activeSelectedId =
    filteredGroups.length > 0 &&
    !filteredGroups.some(({ id }) => id === selectedId)
      ? filteredGroups[0]?.id || ""
      : selectedId;

  const currentIndex = filteredGroups.findIndex(
    ({ id }) => id === activeSelectedId,
  );
  const displayIndex = currentIndex >= 0 ? currentIndex : 0;

  const handleChange = (_: React.SyntheticEvent, newIndex: number) =>
    setSelectedId(filteredGroups[newIndex].id);

  const tabList = filteredGroups.map(({ id, label }, index) => (
    <Tab key={id} label={label} {...a11yProps(index)} />
  ));

  return (
    <Stack gap={2}>
      {/* hook.js:608 Skipping auto-scroll behavior due to `position: sticky` or `position: fixed` on element */}
      <HorizontalTabs
        aria-label="Horizontal tabs"
        onChange={handleChange}
        orientation="horizontal"
        trigger={trigger}
        value={displayIndex}
        variant="scrollable"
      >
        {tabList}
      </HorizontalTabs>
      {filteredGroups.map(({ id, items }, index) => (
        <TabPanel index={index} key={id} value={displayIndex}>
          <ResponsiveGrid
            items={items}
            showLatest={id === LATEST}
            showTopSold={id === TOP_SOLD}
          />
        </TabPanel>
      ))}
    </Stack>
  );
};

export default CustomizedTabs;
