"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import type { BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type DeleteOrganizationForm,
  useDeleteOrganizationFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { getErrorMessage } from "@/utils/errors";

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

export const DELETE_ORGANIZATION_FORM_ID = "delete-organization-form";

interface DeleteOrganizationConfirmProps {
  names: string[];
  onDelete: () => Promise<void>;
}

const DeleteOrganizationConfirm = ({
  names,
  onDelete,
}: DeleteOrganizationConfirmProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const tOrganizations = useTranslations("organizations");

  const [name] = names;
  const isBatch = names.length > 1;
  const expected = isBatch ? String(names.length) : name;

  const deleteOrganizationFormSchema =
    useDeleteOrganizationFormSchema(expected);

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<DeleteOrganizationForm>({
    defaultValues: { confirmation: "" },
    resolver: zodResolver(deleteOrganizationFormSchema),
  });

  const onSubmitHandler = async () => {
    setDialog({ confirmLoading: true });

    try {
      await onDelete();
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id={DELETE_ORGANIZATION_FORM_ID} onSubmit={onSubmit}>
      <ConfirmStack>
        <DialogContentText>
          {isBatch
            ? tOrganizations.rich(
                "actions.batchDeleteOrganization.submit.confirm",
                {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  count: names.length,
                },
              )
            : tOrganizations.rich("actions.deleteOrganization.confirm", {
                bold: (chunks) => <strong>{chunks}</strong>,
                name,
              })}
        </DialogContentText>
        {isBatch && (
          <List dense disablePadding>
            {names.map((name, index) => (
              <ListItem disableGutters key={index}>
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>
        )}
      </ConfirmStack>
      <TextField
        autoComplete="off"
        disabled={confirmLoading}
        error={!!errors.confirmation}
        fullWidth
        helperText={errors.confirmation?.message}
        label={
          isBatch
            ? tOrganizations(
                "actions.batchDeleteOrganization.submit.typeCount",
                {
                  count: names.length,
                },
              )
            : tOrganizations("actions.deleteOrganization.typeName", { name })
        }
        size="small"
        {...register("confirmation")}
      />
    </FormBox>
  );
};

export default DeleteOrganizationConfirm;
