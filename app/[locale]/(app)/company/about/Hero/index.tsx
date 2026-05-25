import { useTranslations } from "next-intl";

import PhotoSlider from "./PhotoSlider";

import GradientBox from "@/components/GradientBox";

import {
  Container,
  type ContainerProps,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)<ContainerProps>(({ theme }) => ({
  padding: theme.spacing(5, 2),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(5),
}));

const Hero = () => {
  const tCompanyAboutHero = useTranslations("company.about.hero");

  const STATS = [
    {
      label: tCompanyAboutHero("stats.founded.label"),
      value: tCompanyAboutHero("stats.founded.value"),
    },
    {
      label: tCompanyAboutHero("stats.ingredients.label"),
      value: tCompanyAboutHero("stats.ingredients.value"),
    },
    {
      label: tCompanyAboutHero("stats.hours.label"),
      value: tCompanyAboutHero("stats.hours.value"),
    },
  ];

  return (
    <StyledContainer component="header" disableGutters maxWidth="lg">
      <Stack alignItems="center" gap={2}>
        <Typography
          color="primary"
          component="h2"
          fontWeight="bold"
          variant="body2"
        >
          {tCompanyAboutHero("subtitle")}
        </Typography>
        <Typography
          color="text.primary"
          component="h2"
          fontWeight="bold"
          textAlign="center"
          variant="h5"
        >
          {tCompanyAboutHero("titleLine1")}
          <br />
          <GradientBox component="span">
            {tCompanyAboutHero("titleLine2")}
          </GradientBox>
        </Typography>
        <Typography color="text.primary" textAlign="center" variant="body1">
          {tCompanyAboutHero("description")}
        </Typography>
      </Stack>
      <PhotoSlider />
      <Stack
        flexWrap="wrap"
        direction="row"
        justifyContent="center"
        alignItems="flex-start"
        gap={5}
      >
        {STATS.map(({ label, value }) => (
          <Stack key={label} alignItems="center" gap={2}>
            <Typography color="primary.main" fontWeight="bold" variant="h4">
              {value}
            </Typography>
            <Typography color="text.secondary" variant="body1">
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </StyledContainer>
  );
};

export default Hero;
