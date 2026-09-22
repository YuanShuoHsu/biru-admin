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
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),

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
  items: readonly {
    key: string;
    label: string;
    value: ReactNode;
  }[];
}

const DetailsCard = ({ action, children, items }: DetailsCardProps) => (
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
      <StyledCardContent>
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
        {children}
      </StyledCardContent>
    </StyledCard>
  </>
);

export default DetailsCard;
