"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import { StyledListItemButton } from "../SelectedListItem/ListItemLink";

import { ORDER_MODE } from "@/constants/orderMode";

import { useOrganization } from "@/hooks/organizations";
import { useRoutes } from "@/hooks/useRoutes";

import { Link } from "@/i18n/navigation";

import {
  Group,
  LocalMall,
  Person,
  Restaurant,
  Storefront,
  TableBar,
} from "@mui/icons-material";
import {
  Chip,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Slot } from "@/types/navItem";
import type { RouteParams } from "@/types/routeParams";

const StyledChip = styled(Chip)(({ theme }) => ({
  marginLeft: "auto",
  padding: theme.spacing(0.5),
}));

const OrderModeMenuItem: Slot = ({ level }) => {
  const { mode, organizationSlug } = useParams<Partial<RouteParams>>();

  const organization = useOrganization();
  const storeName = organization?.name || "";

  const searchParams = useSearchParams();

  const navItem = useRoutes();
  const { icon: ModeIcon, label } = navItem(`/order/${mode}`);
  const { to } = navItem(`/order/${mode}/${organizationSlug}`);

  const tOrder = useTranslations("order");

  if (!storeName || !to) return null;

  const partySize = searchParams.get("partySize");
  const tableNumber = searchParams.get("tableNumber");
  const type = searchParams.get("type");

  const extra =
    mode === ORDER_MODE.DineIn
      ? [
          ...(tableNumber
            ? [
                {
                  icon: <TableBar />,
                  primary: tOrder("mode.dineIn.storeSlug.tableNumber.value", {
                    tableNumber,
                  }),
                },
              ]
            : []),
          ...(partySize
            ? [
                {
                  icon: partySize === "1" ? <Person /> : <Group />,
                  primary: tOrder(
                    "mode.dineIn.storeSlug.tableNumber.partySize.select.value",
                    { count: partySize },
                  ),
                },
              ]
            : []),
        ]
      : mode === ORDER_MODE.Kiosk && type
        ? [
            {
              icon: type === "dine-in" ? <Restaurant /> : <LocalMall />,
              primary: tOrder(
                type === "dine-in" ? "mode.kiosk.dineIn" : "mode.kiosk.takeout",
              ),
            },
          ]
        : [];

  return (
    <ListItem disablePadding>
      <StyledListItemButton
        {...{ component: Link, href: to }}
        level={level}
        selected
      >
        <Stack
          width="100%"
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          <Stack gap={1}>
            <Stack flexDirection="row" alignItems="center" gap={4}>
              <ListItemIcon>
                <Storefront />
              </ListItemIcon>
              <ListItemText primary={storeName} />
            </Stack>
            {extra.map(({ icon, primary }, i) => (
              <Stack key={i} flexDirection="row" alignItems="center" gap={4}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={primary} />
              </Stack>
            ))}
          </Stack>
          <StyledChip
            color="primary"
            icon={ModeIcon && <ModeIcon />}
            label={label}
            size="small"
            variant="outlined"
          />
        </Stack>
      </StyledListItemButton>
    </ListItem>
  );
};

export default OrderModeMenuItem;
