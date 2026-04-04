"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { type CreateUserForm, useCreateUserFormSchema } from "./definitions";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Box,
  type BoxProps,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CreateUserDialogContentProps {
  fetchData: () => Promise<void>;
}

const CreateUserDialogContent = ({
  fetchData,
}: CreateUserDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tAdminsUsers = useTranslations("admins.users");

  const createUserFormSchema = useCreateUserFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateUserForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "user",
    },
    resolver: zodResolver(createUserFormSchema),
  });

  const onSubmitHandler = async (values: CreateUserForm) => {
    await authClient.admin.createUser(
      {
        name: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        password: values.password,
        role: values.role,
        data: {
          firstName: values.firstName,
          lastName: values.lastName,
          emailSubscribed: true,
          lang: "zh-TW",
        },
      },
      {
        onRequest: () => {
          setDialog({ confirmLoading: true });
        },
        onError: ({ error: { code } }) => {
          const message = getErrorMessage(code, locale);
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onSuccess: () => {
          const message = tAdminsUsers("create.success");
          enqueueSnackbar(message, { variant: "success" });

          resetDialog();
          fetchData();
        },
      },
    );
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-user-form" onSubmit={onSubmit}>
      <Stack direction="row" gap={2} width="100%">
        <TextField
          autoComplete="given-name"
          error={!!errors.firstName}
          fullWidth
          helperText={errors.firstName?.message}
          label={tAdminsUsers("create.fields.firstName")}
          required
          {...register("firstName")}
        />
        <TextField
          autoComplete="family-name"
          error={!!errors.lastName}
          fullWidth
          helperText={errors.lastName?.message}
          label={tAdminsUsers("create.fields.lastName")}
          {...register("lastName")}
        />
      </Stack>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tAdminsUsers("create.fields.email")}
        required
        type="email"
        {...register("email")}
      />
      <TextField
        autoComplete="new-password"
        error={!!errors.password}
        fullWidth
        helperText={errors.password?.message}
        label={tAdminsUsers("create.fields.password")}
        required
        type="password"
        {...register("password")}
      />
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>{tAdminsUsers("create.fields.role")}</InputLabel>
            <Select {...field} label={tAdminsUsers("create.fields.role")}>
              <MenuItem value="user">{tAdminsUsers("roles.user")}</MenuItem>
              <MenuItem value="admin">{tAdminsUsers("roles.admin")}</MenuItem>
            </Select>
          </FormControl>
        )}
      />
    </StyledBox>
  );
};

export default CreateUserDialogContent;
