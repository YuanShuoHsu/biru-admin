"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Link, usePathname, useRouter } from "@/i18n/navigation";

import {
  Category,
  Edit,
  RestaurantMenu,
  Tune,
  type SvgIconComponent,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu } from "@/types/menus";

import { localize } from "@/utils/locale";

import UpdateMenuDialog from "../UpdateMenuDialog";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  width: "100%",
  backgroundColor: theme.palette.action.hover,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  aspectRatio: "16 / 9",
  flexShrink: 0,

  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(25),
    aspectRatio: "auto",
  },
}));

const StyledCardContent = styled(CardContent)({
  paddingBottom: 0,
});

const WrapTypography = styled(Typography)({
  overflowWrap: "break-word",
});

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
}));

interface MenusTabsLayoutProps {
  canWrite?: boolean;
  children: React.ReactNode;
  menu?: Menu;
}

const MenusTabsLayout = ({
  canWrite = false,
  children,
  menu,
}: MenusTabsLayoutProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const organization = searchParams.get("organization");
  const query = new URLSearchParams({
    ...(organization && { organization }),
    page: "1",
    pageSize: "10",
  }).toString();

  const tMenus = useTranslations("menus");

  const tabs: {
    Icon: SvgIconComponent;
    label: string;
    value: string;
  }[] = [
    {
      Icon: Category,
      label: tMenus("sections.label"),
      value: "/menus/sections",
    },
    {
      Icon: Tune,
      label: tMenus("modifierGroups.label"),
      value: "/menus/modifier-groups",
    },
  ];

  const currentTab =
    tabs.find(({ value }) => pathname.startsWith(value))?.value ??
    tabs[0].value;

  const handleEditMenu = () => {
    if (!menu) return;

    setDialog({
      content: <UpdateMenuDialog menu={menu} mutate={router.refresh} />,
      formId: "update-menu-form",
      open: true,
      title: tMenus("settings.actions.update.title"),
    });
  };

  return (
    <Stack height="100%" gap={2}>
      {menu && (
        <StyledCard variant="outlined">
          <StyledCardMedia image={menu.image || undefined}>
            {!menu.image && (
              <RestaurantMenu color="disabled" fontSize="large" />
            )}
          </StyledCardMedia>
          <Stack flex={1} minWidth={0}>
            <StyledCardContent>
              <WrapTypography fontWeight="bold" variant="subtitle1">
                {localize(menu.name, locale)}
              </WrapTypography>
              {localize(menu.description, locale) && (
                <WrapTypography color="text.secondary" variant="body2">
                  {localize(menu.description, locale)}
                </WrapTypography>
              )}
            </StyledCardContent>
            <StyledCardActions>
              {canWrite && (
                <Button
                  onClick={handleEditMenu}
                  size="small"
                  startIcon={<Edit fontSize="small" />}
                  variant="outlined"
                >
                  {tMenus("settings.actions.update.title")}
                </Button>
              )}
            </StyledCardActions>
          </Stack>
        </StyledCard>
      )}
      <Tabs
        aria-label="menu tabs"
        scrollButtons="auto"
        value={currentTab}
        variant="scrollable"
      >
        {tabs.map(({ Icon, label, value }) => (
          <Tab
            component={Link}
            href={`${value}?${query}`}
            icon={<Icon fontSize="small" />}
            iconPosition="start"
            key={value}
            label={label}
            value={value}
          />
        ))}
      </Tabs>
      {children}
    </Stack>
  );
};

export default MenusTabsLayout;
