import { useTranslations } from "next-intl";

import GradientBox from "@/components/GradientBox";

import { ChevronRight } from "@mui/icons-material";
import {
  Button,
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

const JoinUs = () => {
  const tCompanyAboutJoinUs = useTranslations("company.about.joinUs");

  return (
    <StyledContainer component="section" disableGutters maxWidth="lg">
      <Stack alignItems="center" gap={2}>
        <Typography
          color="primary.main"
          component="h2"
          fontWeight="bold"
          variant="body2"
        >
          {tCompanyAboutJoinUs("label")}
        </Typography>
        <Typography
          color="text.primary"
          component="h2"
          fontWeight="bold"
          textAlign="center"
          variant="h5"
        >
          <GradientBox component="span">
            {tCompanyAboutJoinUs("titleLine1")}
          </GradientBox>
          <br />
          {tCompanyAboutJoinUs("titleLine2")}
        </Typography>
        <Typography color="text.secondary" textAlign="center" variant="body1">
          {tCompanyAboutJoinUs("description")}
        </Typography>
      </Stack>
      <Button endIcon={<ChevronRight />} href="#" variant="contained">
        {tCompanyAboutJoinUs("button")}
      </Button>
    </StyledContainer>
  );
};

export default JoinUs;
