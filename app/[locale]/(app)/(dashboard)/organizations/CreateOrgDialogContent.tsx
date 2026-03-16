"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateOrganizationForm,
  useCreateOrganizationFormSchema,
} from "./definitions";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

const CreateOrgDialogContent = () => {
  const { resetDialog, setDialog } = useDialogStore((s) => s);

  const router = useRouter();

  const tOrganizations = useTranslations("organizations.create");

  const schema = useCreateOrganizationFormSchema();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<CreateOrganizationForm>({
    defaultValues: { name: "", slug: "" },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    setDialog({ confirmDisabled: isSubmitting });
  }, [isSubmitting, setDialog]);

  const handleNameChange = (name: string) => {
    setValue("name", name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setValue("slug", slug);
  };

  const handleCreateSubmit = async (values: CreateOrganizationForm) => {
    const result = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    });
    if (result.error) {
      enqueueSnackbar(tOrganizations("error"), { variant: "error" });
      return;
    }
    enqueueSnackbar(tOrganizations("success"), { variant: "success" });
    resetDialog();
    router.refresh();
  };

  return (
    <StyledBox
      component="form"
      id="create-organization-form"
      onSubmit={handleSubmit(handleCreateSubmit)}
    >
      <TextField
        autoComplete="organization"
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrganizations("name.label")}
        placeholder={tOrganizations("name.label")}
        required
        {...register("name", {
          onChange: (e) => handleNameChange(e.target.value),
        })}
      />
      <TextField
        error={!!errors.slug}
        fullWidth
        helperText={errors.slug?.message}
        label={tOrganizations("slug.label")}
        placeholder={tOrganizations("slug.placeholder")}
        required
        {...register("slug")}
      />
    </StyledBox>
  );
};

export default CreateOrgDialogContent;
