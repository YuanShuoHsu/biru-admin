// https://mui.com/material-ui/react-badge/#system-CustomizedBadges.tsx

import { Badge, type BadgeProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  "& .MuiBadge-badge": {
    padding: "0 4px",
    right: -3,
    top: 13,
    border: `2px solid ${theme.vars.palette.primary.main}`,

    [theme.getColorSchemeSelector("dark")]: {
      borderColor: theme.vars.palette.background.paper,
    },
  },
}));

interface CustomizedBadgesProps extends BadgeProps {
  children: React.ReactNode;
}

const CustomizedBadges = ({ children, ...rest }: CustomizedBadgesProps) => (
  <StyledBadge color="secondary" {...rest}>
    {children}
  </StyledBadge>
);

export default CustomizedBadges;
