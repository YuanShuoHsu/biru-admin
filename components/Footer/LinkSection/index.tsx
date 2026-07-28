"use client";

import { ORDER_MODE } from "@/constants/orderMode";

import { useNavChildren } from "@/hooks/useNavChildren";
import { useRoutes } from "@/hooks/useRoutes";

import { Grid, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { NavItem } from "@/types/navItem";

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
}));

const useFooterItems = (): NavItem[] => {
  const navItem = useRoutes();

  const navChildren = useNavChildren();

  return [
    {
      ...navItem("/order"),
      children: [navItem(`/order/${ORDER_MODE.Pickup}`)],
    },
    {
      ...navItem("/auth"),
      children: navChildren["/auth"],
    },
    {
      ...navItem("/company"),
      children: navChildren["/company"],
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
