// https://mui.com/material-ui/react-tabs/#ScrollableTabsButtonAuto.tsx
// https://github.com/mui/material-ui/issues/10739

"use client";

import { useState } from "react";

import OrderBottomBar from "./OrderBottomBar";
import ResponsiveGrid from "./ResponsiveGrid";

import CustomTabPanel from "@/components/CustomTabPanel";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";
import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";

import { Stack, Tab, Tabs, useScrollTrigger } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useMenuStore } from "@/providers/menu-store-provider";
import { useOrderSearchStore } from "@/providers/order-search-store-provider";

import { a11yProps } from "@/utils/tab";

const StyledTabs = styled(Tabs, {
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
  transition: theme.transitions.create(["background-color", "transform"]),
  zIndex: theme.zIndex.appBar - 1,
}));

const OrderMenuContent = () => {
  const { menus } = useMenuStore((state) => state);

  const { orderSearchText } = useOrderSearchStore((state) => state);
  const searchText = orderSearchText.trim().toLowerCase();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  // const tOrder = useTranslations("order");

  console.log(menus);

  const categoryGroups = menus
    .map((menu) => ({
      ...menu,
      menuItems: menu.menuItems.filter(
        ({ offers }) => offers[0]?.availability !== "Discontinued",
      ),
    }))
    .filter(({ menuItems }) => menuItems.length > 0);

  // const allItems = categoryGroups.flatMap(({ menuItems }) => menuItems);

  // TODO: 需等訂單系統完成後，後端補上 sold 欄位才能啟用
  // const topSoldItems = [...allItems]
  //   .sort((a, b) => b.sold - a.sold)
  //   .slice(0, TOP_SOLD_LIMIT);

  // const topSoldGroups =
  //   topSoldItems.length > 0
  //     ? {
  //         id: TOP_SOLD,
  //         items: topSoldItems,
  //         label: tOrder("mode.storeSlug.tableNumber.topSold"),
  //       }
  //     : null;

  // const latestItems = allItems.filter(
  //   ({ createdAt }) =>
  //     dayjs().diff(dayjs(createdAt), "day") <= NEW_PRODUCT_DAYS,
  // );

  // const latestGroups =
  //   latestItems.length > 0
  //     ? ({
  //         id: LATEST,
  //         name: tOrder("mode.storeSlug.tableNumber.latest"),
  //         menuItems: latestItems,
  //       } as components["schemas"]["OrderMenuResponseDto"])
  //     : null;

  const combinedGroups = [
    // ...(topSoldGroups ? [topSoldGroups] : []),
    // ...(latestGroups ? [latestGroups] : []),
    ...categoryGroups,
  ];

  const filteredGroups = combinedGroups
    .map((group) => ({
      ...group,
      menuItems: group.menuItems.filter(({ name }) =>
        name.toLowerCase().includes(searchText),
      ),
    }))
    .filter(
      ({ menuItems, name }) =>
        name.toLowerCase().includes(searchText) || menuItems.length > 0,
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

  return (
    <>
      <Stack gap={2}>
        {/* hook.js:608 Skipping auto-scroll behavior due to `position: sticky` or `position: fixed` on element */}
        <StyledTabs
          aria-label="menu category tabs"
          onChange={handleChange}
          scrollButtons="auto"
          trigger={trigger}
          value={displayIndex}
          variant="scrollable"
        >
          {filteredGroups.map(({ id, name }, index) => (
            <Tab key={id} label={name} {...a11yProps(index)} />
          ))}
        </StyledTabs>
        {filteredGroups.map((group, index) => (
          <CustomTabPanel index={index} key={group.id} value={displayIndex}>
            <ResponsiveGrid group={group} />
          </CustomTabPanel>
        ))}
      </Stack>
      <OrderBottomBar />
    </>
  );
};

export default OrderMenuContent;
