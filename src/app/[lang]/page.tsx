"use client";

import React, { useState } from "react";

import { useI18n } from "@/context/i18n";

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardProps,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const StyledCard = styled(Card)<CardProps>(() => ({
  width: "100%",
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: 0,
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: 0,
}));

const Home = () => {
  const [form, setForm] = useState({ email: "", password: "" });

  const dict = useI18n();

  const handleChange = ({
    target: { name, value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    // console.log({ email, password });
  };

  return (
    <StyledContainer maxWidth="sm" disableGutters>
      <StyledCard component="form" onSubmit={handleSubmit}>
        <StyledCardHeader
          title={
            <Typography color="primary" textAlign="center" variant="h6">
              {dict.login.title}
            </Typography>
          }
        />
        <StyledCardContent>
          <TextField
            fullWidth
            label={dict.login.email}
            name="email"
            onChange={handleChange}
            required
            type="email"
            value={form.email}
          />
          <TextField
            fullWidth
            label={dict.login.password}
            name="password"
            onChange={handleChange}
            required
            type="password"
            value={form.password}
          />
        </StyledCardContent>
        <StyledCardActions>
          <Button fullWidth size="large" type="submit" variant="contained">
            {dict.login.submit}
          </Button>
        </StyledCardActions>
      </StyledCard>
    </StyledContainer>
  );
};

export default Home;
