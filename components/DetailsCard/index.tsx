import type { ReactNode } from "react";

import { Edit } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)({
  flex: 1,
  display: "flex",
  flexDirection: "column",
});

const StyledCardContent = styled(CardContent, {
  shouldForwardProp: (prop) => prop !== "centered",
})<{ centered: boolean }>(({ centered, theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),

  ...(centered && {
    justifyContent: "center",
    alignItems: "center",
  }),

  "&:last-child": {
    paddingBottom: theme.spacing(2),
  },
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

interface DetailsCardProps {
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  empty?: string;
  items?: readonly {
    key: string;
    label: string;
    value: ReactNode;
  }[];
}

const DetailsCard = ({
  action,
  children,
  empty,
  items = [],
}: DetailsCardProps) => {
  const showEmpty = !items.length && Boolean(empty);

  return (
    <>
      {action && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            onClick={action.onClick}
            size="small"
            startIcon={<Edit />}
            variant="contained"
          >
            {action.label}
          </Button>
        </Stack>
      )}
      <StyledCard variant="outlined">
        <StyledCardContent centered={showEmpty}>
          {items.length > 0 && (
            <Grid container spacing={2}>
              {items.map(({ key, label, value }) => (
                <StyledGrid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography color="text.secondary" variant="body2">
                    {label}
                  </Typography>
                  <Typography component="div" variant="body1">
                    {value}
                  </Typography>
                </StyledGrid>
              ))}
            </Grid>
          )}
          {showEmpty && (
            <Typography color="text.secondary" variant="body2">
              {empty}
            </Typography>
          )}
          {children}
        </StyledCardContent>
      </StyledCard>
    </>
  );
};

export default DetailsCard;
