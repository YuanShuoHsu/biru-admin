"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import RouteTabs from "@/components/RouteTabs";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { Link, useRouter } from "@/i18n/navigation";

import { Edit, History, RestaurantMenu } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Stack,
  Typography,
} from "@mui/material";
import { type CSSObject, styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu } from "@/types/menus";

import { getHref } from "@/utils/href";
import { localize } from "@/utils/locale";

import theme from "@/theme";
import UpdateMenuDialog from "../UpdateMenuDialog";

const LayoutStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  gap: theme.spacing(2),
}));

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

const InfoStack = styled(Stack)({
  flex: 1,
  minWidth: 0,
});

const StyledCardContent = styled(CardContent)({
  paddingBottom: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
});

const wrapStyle: CSSObject = {
  overflowWrap: "anywhere",
};

const NameTypography = styled(Typography)({
  ...wrapStyle,
  fontWeight: "bold",
});

const WrapTypography = styled(Typography)(wrapStyle);

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
}));

interface MenusTabsLayoutProps {
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  children: React.ReactNode;
  menu: Menu;
}

const MenusTabsLayout = ({
  canViewAuditLog = false,
  canWrite = false,
  children,
  menu,
}: MenusTabsLayoutProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const router = useRouter();

  const searchParams = useSearchParams();

  const tAudit = useTranslations("audit");
  const tMenus = useTranslations("menus");

  const handleEditMenu = () => {
    setDialog({
      content: <UpdateMenuDialog menu={menu} mutate={router.refresh} />,
      formId: "update-menu-form",
      open: true,
      title: tMenus("settings.actions.update.title"),
    });
  };

  return (
    <LayoutStack>
      <StyledCard variant="outlined">
        <StyledCardMedia image={menu.image || undefined}>
          {!menu.image && <RestaurantMenu color="disabled" fontSize="large" />}
        </StyledCardMedia>
        <InfoStack>
          <StyledCardContent>
            <NameTypography variant="subtitle1">
              {localize(menu.name, locale)}
            </NameTypography>
            {localize(menu.description, locale) && (
              <WrapTypography color="textSecondary" variant="body2">
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
            {canViewAuditLog && (
              <Button
                component={Link}
                href={getHref("/menus/audit-logs", {
                  ...DEFAULT_PAGINATION_QUERY,
                  organization: searchParams.get("organization"),
                })}
                size="small"
                startIcon={<History fontSize="small" />}
                variant="outlined"
              >
                {tAudit("title")}
              </Button>
            )}
          </StyledCardActions>
        </InfoStack>
      </StyledCard>
      <RouteTabs
        ariaLabel="menu tabs"
        tabs={[{ path: "/menus/sections" }, { path: "/menus/modifier-groups" }]}
      />
      {children}
    </LayoutStack>
  );
};

export default MenusTabsLayout;
