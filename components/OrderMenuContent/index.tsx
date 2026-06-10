// https://mui.com/material-ui/react-tabs/#ScrollableTabsButtonAuto.tsx
// https://github.com/mui/material-ui/issues/10739

"use client";

import { useEffect, useRef, useState } from "react";

import OrderBottomBar from "./OrderBottomBar";
import ResponsiveGrid from "./ResponsiveGrid";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";
import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";

import {
  Box,
  Stack,
  Tab,
  Tabs,
  Typography,
  useScrollTrigger,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useMenuStore } from "@/providers/menu-store-provider";
import { useOrderSearchStore } from "@/providers/order-search-store-provider";

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

const TABS_HEIGHT = 48;

const SectionBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  scrollMarginTop: `calc(${APP_BAR_TOOLBAR_HEIGHT + TABS_HEIGHT}px + ${theme.spacing(2)})`,

  [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
    scrollMarginTop: `calc(${APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE + TABS_HEIGHT}px + ${theme.spacing(2)})`,
  },

  [theme.breakpoints.up("sm")]: {
    scrollMarginTop: `calc(${APP_BAR_TOOLBAR_HEIGHT_SM_UP + TABS_HEIGHT}px + ${theme.spacing(2)})`,
  },
}));

const SectionTypography = styled(Typography)(({ theme }) => ({
  borderLeft: `${theme.spacing(0.375)} solid ${theme.vars.palette.primary.main}`,
  paddingLeft: theme.spacing(1),
}));

const OrderMenuContent = () => {
  const [selectedId, setSelectedId] = useState("");

  const sectionRefs = useRef(new Map<string, HTMLDivElement>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingRef = useRef<{
    id: string;
    timer?: ReturnType<typeof setTimeout>;
  }>({ id: "" });

  const { menus } = useMenuStore((state) => state);

  const { orderSearchText } = useOrderSearchStore((state) => state);
  const searchText = orderSearchText.trim().toLowerCase();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  // const tOrder = useTranslations("order");;

  // const allItems = menus.flatMap(({ menuItems }) => menuItems);

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
    ...menus,
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

  const displayIndex = Math.max(
    0,
    filteredGroups.findIndex(({ id }) => id === selectedId),
  );

  useEffect(() => {
    const pending = pendingRef.current;
    const offset = APP_BAR_TOOLBAR_HEIGHT + TABS_HEIGHT;

    const observer = new IntersectionObserver(
      () => {
        let topId = "";
        let minTop = Infinity;
        for (const [id, section] of sectionRefs.current) {
          const { bottom, top } = section.getBoundingClientRect();
          if (bottom <= offset || top >= minTop) continue;

          minTop = top;
          topId = id;
        }
        if (!topId) return;

        if (!pending.id) return setSelectedId(topId);
        if (topId === pending.id) pending.id = "";
      },
      { rootMargin: `-${offset}px 0px 0px 0px` },
    );

    observerRef.current = observer;
    sectionRefs.current.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      observerRef.current = null;
      clearTimeout(pending.timer);
    };
  }, []);

  const handleChange = (_: React.SyntheticEvent, newIndex: number) => {
    const { id } = filteredGroups[newIndex];
    const section = sectionRefs.current.get(id);
    if (!section) return;

    setSelectedId(id);

    const pending = pendingRef.current;
    pending.id = id;
    clearTimeout(pending.timer);
    pending.timer = setTimeout(() => {
      pending.id = "";
    }, 1000);

    section.style.scrollMarginTop = "";
    const styles = getComputedStyle(section);
    const expandedMargin = parseFloat(styles.scrollMarginTop);
    const collapsedMargin = TABS_HEIGHT + parseFloat(styles.rowGap);
    const { top } = section.getBoundingClientRect();

    if (
      top > expandedMargin &&
      window.scrollY + top - collapsedMargin > SCROLL_TRIGGER_THRESHOLD
    )
      section.style.scrollMarginTop = `${collapsedMargin}px`;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          {filteredGroups.map(({ id, name }) => (
            <Tab key={id} label={name} />
          ))}
        </StyledTabs>
        {filteredGroups.map((group) => (
          <SectionBox
            key={group.id}
            ref={(node: HTMLDivElement) => {
              sectionRefs.current.set(group.id, node);
              observerRef.current?.observe(node);

              return () => {
                observerRef.current?.unobserve(node);
                sectionRefs.current.delete(group.id);
              };
            }}
          >
            <SectionTypography
              color="primary"
              fontWeight="bold"
              variant="subtitle1"
            >
              {group.name}
            </SectionTypography>
            <ResponsiveGrid group={group} />
          </SectionBox>
        ))}
      </Stack>
      <OrderBottomBar />
    </>
  );
};

export default OrderMenuContent;
