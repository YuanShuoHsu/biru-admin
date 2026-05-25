import { useTranslations } from "next-intl";

import GradientBox from "@/components/GradientBox";

import {
  Favorite,
  RocketLaunch,
  TrendingUp,
  Tune,
  type SvgIconComponent,
} from "@mui/icons-material";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

type ValueKey =
  | "userObsessed"
  | "keepItSimple"
  | "chaseBetter"
  | "trustAndDeliver";

const VALUE_KEYS: { icon: SvgIconComponent; key: ValueKey }[] = [
  { icon: Favorite, key: "userObsessed" },
  { icon: Tune, key: "keepItSimple" },
  { icon: TrendingUp, key: "chaseBetter" },
  { icon: RocketLaunch, key: "trustAndDeliver" },
];

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(5, 2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const IconBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
  borderRadius: theme.shape.borderRadius,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const Values = () => {
  const tCompanyAboutValues = useTranslations("company.about.values");

  return (
    <Box bgcolor="background.paper" component="section">
      <StyledContainer disableGutters maxWidth="lg">
        <Stack gap={1}>
          <Typography
            color="primary.main"
            component="h2"
            fontWeight="bold"
            variant="body2"
          >
            {tCompanyAboutValues("subtitle")}
          </Typography>
          <Typography
            color="text.primary"
            component="h2"
            fontWeight="bold"
            variant="h5"
          >
            {tCompanyAboutValues("titlePrefix")}
            <GradientBox component="span">
              {tCompanyAboutValues("titleGradient")}
            </GradientBox>
          </Typography>
          <Typography color="text.secondary" variant="body1">
            {tCompanyAboutValues("description")}
          </Typography>
        </Stack>
        <Grid container spacing={2}>
          {VALUE_KEYS.map(({ icon: Icon, key }) => {
            const title = tCompanyAboutValues(`values.${key}.title`);

            return (
              <StyledGrid key={key} size={{ xs: 12, md: 3 }}>
                <Stack alignItems="center" direction="row" gap={1}>
                  <IconBox>
                    <Icon color="primary" fontSize="small" />
                  </IconBox>
                  <Typography
                    color="text.primary"
                    component="h3"
                    fontWeight="bold"
                    variant="body2"
                  >
                    <Box component="span" color="primary.main">
                      {title[0]}
                    </Box>
                    {title.slice(1)}
                  </Typography>
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  {tCompanyAboutValues(`values.${key}.description`)}
                </Typography>
              </StyledGrid>
            );
          })}
        </Grid>
      </StyledContainer>
    </Box>
  );
};

export default Values;
