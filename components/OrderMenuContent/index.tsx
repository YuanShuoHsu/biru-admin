// https://mui.com/material-ui/react-tabs/#ScrollableTabsButtonAuto.tsx
// https://github.com/mui/material-ui/issues/10739

"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import MenuCard from "./MenuCard";
import OrderBottomBar from "./OrderBottomBar";
import ResponsiveGrid from "./ResponsiveGrid";

import OrderSearch from "@/components/OrderSearch";
import ViewToggleButtons from "@/components/ViewToggleButtons";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";
import { SCROLL_TRIGGER_THRESHOLD } from "@/constants/scroll";
import {
  FEATURED_LIMIT,
  LATEST,
  NEW_PRODUCT_DAYS,
  TOP_SOLD,
} from "@/constants/tab";

import { Box, Tab, Tabs, Typography, useScrollTrigger } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useMenuStore } from "@/providers/menu-store-provider";
import { useOrderSearchStore } from "@/providers/order-search-store-provider";

const TABS_HEIGHT = 48;
const CONTROLS_HEIGHT = 72;
const HEADER_HEIGHT = CONTROLS_HEIGHT + TABS_HEIGHT;

const HeaderBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "trigger",
})<{ trigger: boolean }>(({ theme, trigger }) => ({
  position: "sticky",
  top: trigger ? -CONTROLS_HEIGHT : APP_BAR_TOOLBAR_HEIGHT,
  backgroundColor: theme.vars.palette.background.paper,
  transition: theme.transitions.create(["background-color", "top"]),
  zIndex: theme.zIndex.appBar - 1,
  borderRadius: theme.vars.shape.borderRadius,
  boxShadow: `inset 0 0 0 1px ${theme.vars.palette.divider}`,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",

  [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
    top: trigger ? -CONTROLS_HEIGHT : APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
  },

  [theme.breakpoints.up("sm")]: {
    top: trigger ? 0 : APP_BAR_TOOLBAR_HEIGHT_SM_UP,
    flexDirection: "row-reverse",
    alignItems: "center",
  },
}));

const ControlsBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    flex: 1,
    minWidth: 0,
  },
}));

const SectionBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  scrollMarginTop: `calc(${APP_BAR_TOOLBAR_HEIGHT + HEADER_HEIGHT}px + ${theme.spacing(2)})`,
  "--collapsed-header-height": `${TABS_HEIGHT}px`,

  [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
    scrollMarginTop: `calc(${APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE + HEADER_HEIGHT}px + ${theme.spacing(2)})`,
  },

  [theme.breakpoints.up("sm")]: {
    scrollMarginTop: `calc(${APP_BAR_TOOLBAR_HEIGHT_SM_UP + CONTROLS_HEIGHT}px + ${theme.spacing(2)})`,
    "--collapsed-header-height": `${CONTROLS_HEIGHT}px`,
  },
}));

const SectionTypography = styled(Typography)(({ theme }) => ({
  borderLeft: `${theme.spacing(0.375)} solid ${theme.vars.palette.primary.main}`,
  paddingLeft: theme.spacing(1),
}));

const OrderMenuContent = () => {
  const [selectedId, setSelectedId] = useState("");

  const headerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLDivElement>());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingRef = useRef<{
    id: string;
    timer?: ReturnType<typeof setTimeout>;
  }>({ id: "" });

  const { menu } = useMenuStore((state) => state);

  const { orderSearchText } = useOrderSearchStore((state) => state);
  const searchText = orderSearchText.trim().toLowerCase();

  const trigger = useScrollTrigger({
    threshold: SCROLL_TRIGGER_THRESHOLD,
  });

  const tOrder = useTranslations("order");

  const sections = menu?.sections || [];

  const allItems = sections.flatMap(({ menuItems }) => menuItems);

  const topSoldItems = allItems
    .filter(({ sold }) => sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, FEATURED_LIMIT);

  const latestItems = allItems
    .filter(
      ({ createdAt }) =>
        dayjs().diff(dayjs(createdAt), "day") <= NEW_PRODUCT_DAYS,
    )
    .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)))
    .slice(0, FEATURED_LIMIT);

  const combinedSections = [
    ...(topSoldItems.length
      ? [
          {
            id: TOP_SOLD,
            menuItems: topSoldItems,
            name: tOrder("mode.storeSlug.tableNumber.topSold"),
          },
        ]
      : []),
    ...(latestItems.length
      ? [
          {
            id: LATEST,
            menuItems: latestItems,
            name: tOrder("mode.storeSlug.tableNumber.latest"),
          },
        ]
      : []),
    ...sections,
  ];

  const filteredSections = combinedSections
    .map((section) => ({
      ...section,
      menuItems: section.menuItems.filter(({ name }) =>
        name.toLowerCase().includes(searchText),
      ),
    }))
    .filter(
      ({ menuItems, name }) =>
        name.toLowerCase().includes(searchText) || menuItems.length > 0,
    );

  const displayIndex = Math.max(
    0,
    filteredSections.findIndex(({ id }) => id === selectedId),
  );

  useEffect(() => {
    const pending = pendingRef.current;
    const offset =
      APP_BAR_TOOLBAR_HEIGHT +
      (headerRef.current?.offsetHeight ?? HEADER_HEIGHT);

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
    const { id } = filteredSections[newIndex];
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
    const collapsedMargin =
      parseFloat(styles.getPropertyValue("--collapsed-header-height")) +
      parseFloat(styles.rowGap);
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
      {/* hook.js:608 Skipping auto-scroll behavior due to `position: sticky` or `position: fixed` on element */}
      <MenuCard />
      <HeaderBox ref={headerRef} trigger={trigger}>
        <ControlsBox>
          <OrderSearch />
          <ViewToggleButtons />
        </ControlsBox>
        <StyledTabs
          aria-label="menu category tabs"
          onChange={handleChange}
          scrollButtons="auto"
          value={displayIndex}
          variant="scrollable"
        >
          {filteredSections.map(({ id, name }) => (
            <Tab key={id} label={name} />
          ))}
        </StyledTabs>
      </HeaderBox>
      {!filteredSections.length && (
        <Typography align="center" color="text.secondary">
          {tOrder("mode.storeSlug.tableNumber.search.noResults")}
        </Typography>
      )}
      {filteredSections.map(({ id, menuItems, name }) => (
        <SectionBox
          key={id}
          ref={(node: HTMLDivElement) => {
            sectionRefs.current.set(id, node);
            observerRef.current?.observe(node);

            return () => {
              observerRef.current?.unobserve(node);
              sectionRefs.current.delete(id);
            };
          }}
        >
          <SectionTypography
            color="primary"
            fontWeight="bold"
            variant="subtitle1"
          >
            {name}
          </SectionTypography>
          <ResponsiveGrid menuItems={menuItems} />
        </SectionBox>
      ))}
      <OrderBottomBar />
    </>
  );
};

export default OrderMenuContent;
