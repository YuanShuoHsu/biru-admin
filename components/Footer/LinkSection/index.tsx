"use client";

import { ORDER_MODE } from "@/constants/orderMode";

import { useAuthNavItems } from "@/hooks/useAuth";
import { useCompanyNavItems } from "@/hooks/useCompany";
import { useRoutes } from "@/hooks/useRoutes";

import { Divider, Grid, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { NavItem } from "@/types/navItem";

import { useAccountNavItems } from "@/utils/account";
const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
}));

const useFooterItems = (): NavItem[] => {
  const { session } = useAuthStore((state) => state);

  const navItem = useRoutes();

  const accountChildren = useAccountNavItems(() => <Divider flexItem />);
  const authChildren = useAuthNavItems();
  const companyChildren = useCompanyNavItems();

  return [
    {
      ...navItem("/order"),
      children: [navItem(`/order/${ORDER_MODE.Pickup}`)],
    },
    {
      ...navItem("/auth"),
      children: session ? accountChildren : authChildren,
    },
    {
      ...navItem("/company"),
      children: companyChildren,
    },
  ];
};

const LinkSection = () => {
  const footerItems = useFooterItems();

  return (
    <Grid container spacing={2}>
      {footerItems.map(({ children, label: parentLabel, path: parentPath }) => (
        <StyledGrid key={parentPath} size={{ xs: 6, md: 2 }}>
          <Typography color="text.primary" variant="subtitle2">
            {parentLabel}
          </Typography>
          {children?.map(
            (
              { label: childLabel, onClick, slot: Slot, to: childTo },
              itemIndex,
            ) => {
              if (Slot) return <Slot key={itemIndex} level={0} />;

              return (
                <Link
                  color="text.secondary"
                  component={onClick ? "button" : "a"}
                  href={onClick ? undefined : childTo}
                  key={itemIndex}
                  onClick={onClick}
                  underline="hover"
                  variant="body2"
                >
                  {childLabel}
                </Link>
              );
            },
          )}
        </StyledGrid>
      ))}
    </Grid>
  );
};

export default LinkSection;
