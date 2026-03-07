"use client";

import {
  Avatar,
  Box,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

const About = () => {
  return (
    <Box>
      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "radial-gradient(ellipse at 50% 50%, #121212 0%, #000000 100%)"
              : "linear-gradient(180deg, #CEE5FD 0%, #FFFFFF 100%)",
          pt: { xs: 8, sm: 12 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "2.5rem", sm: "3.5rem" },
              fontWeight: 700,
              textAlign: "center",
              mb: 2,
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              backgroundClip: "text",
              textFillColor: "transparent",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            We&apos;re on a mission to make better coffee effortless.
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            align="center"
            sx={{ mb: 4 }}
          >
            We help you start your day with the perfect cup, served with speed
            and style.
          </Typography>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} justifyContent="center">
          {[
            { label: "Founded", value: "2024" },
            { label: "Coffees Served", value: "10k+" },
            { label: "Community", value: "500+" },
            { label: "Team Members", value: "10" },
          ].map((stat) => (
            <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
              <Stack alignItems="center">
                <Typography variant="h3" fontWeight="bold" color="primary">
                  {stat.value}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stat.label}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Divider />
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
          The Biru Pact
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {[
            {
              title: "User-obsessed \ud83d\udc99",
              desc: "We put our customers first in everything we do.",
            },
            {
              title: "Keep it simple \ud83d\udeab",
              desc: "Complexity is the enemy only the necessary.",
            },
            {
              title: 'Chase "better" \ud83c\udf31',
              desc: "Continuous improvement is our daily mantra.",
            },
            {
              title: "Trust and deliver \ud83d\ude80",
              desc: "We deliver on our promises, every single time.",
            },
          ].map((value) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={value.title}>
              <Box
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {value.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {value.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Box sx={{ bgcolor: "background.paper", py: 12 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            fontWeight="bold"
            gutterBottom
          >
            Meet the Biru Team
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 8 }}
          >
            A small team with big dreams.
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[1, 2, 3, 4].map((member) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={member}>
                <Stack alignItems="center" spacing={2}>
                  <Avatar
                    sx={{ width: 120, height: 120, bgcolor: "primary.main" }}
                  >
                    B{member}
                  </Avatar>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      Team Member {member}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Coffee Specialist
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default About;
