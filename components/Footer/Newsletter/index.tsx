"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useForm } from "react-hook-form";
import useSWRMutation from "swr/mutation";
import { z } from "zod";

import { useNewsletterFormSchema } from "./definitions";

import BrandMark from "@/components/BrandMark";

import { zodResolver } from "@hookform/resolvers/zod";

import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { sendRequest } from "@/utils/fetcher";

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  alignItems: "flex-start",
}));

const Newsletter = () => {
  const tAuth = useTranslations("auth");
  const tHome = useTranslations("home");

  const newsletterFormSchema = useNewsletterFormSchema();
  type NewsletterFormData = z.infer<typeof newsletterFormSchema>;

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<NewsletterFormData>({
    defaultValues: { email: "" },
    resolver: zodResolver(newsletterFormSchema),
  });

  const { enqueueSnackbar } = useSnackbar();

  const { isMutating, trigger } = useSWRMutation<
    void,
    Error,
    string,
    { email: string }
  >("/api/newsletter", sendRequest());

  const onSubmit = handleSubmit(async (data) => {
    try {
      await trigger({ email: data.email });

      reset();
      enqueueSnackbar(tHome("footer.newsletter.success"), {
        variant: "success",
      });
    } catch {
    } finally {
    }
  });

  return (
    <StyledGrid size={{ xs: 12, md: 6 }}>
      <BrandMark color="text.primary" />
      <Typography color="text.primary" variant="subtitle2">
        {tHome("footer.newsletter.title")}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {tHome("footer.newsletter.subtitle")}
      </Typography>
      <Box
        component="form"
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={1}
        onSubmit={onSubmit}
        width="100%"
      >
        <TextField
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          label={tAuth("email.label")}
          placeholder={tAuth("email.placeholder")}
          required
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "transparent",
            },
          }}
          type="email"
          {...register("email")}
        />
        <Button
          disabled={isMutating}
          loading={isMutating}
          loadingPosition="start"
          size="small"
          type="submit"
          variant="outlined"
        >
          {tHome("footer.newsletter.action")}
        </Button>
      </Box>
    </StyledGrid>
  );
};

export default Newsletter;
