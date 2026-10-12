"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { DialogContentText, Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

interface DeleteOrganizationConfirmProps {
  name: string;
}

const DeleteOrganizationConfirm = ({
  name,
}: DeleteOrganizationConfirmProps) => {
  const { confirmLoading, setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const [typedName, setTypedName] = useState("");

  const matches = typedName.trim() === name;

  useEffect(() => {
    setDialog({ confirmDisabled: !matches });
  }, [matches, setDialog]);

  return (
    <StyledStack>
      <DialogContentText>
        {tOrganizations.rich("actions.deleteOrganization.confirm", {
          bold: (chunks) => <strong>{chunks}</strong>,
          name,
        })}
      </DialogContentText>
      <TextField
        autoComplete="off"
        disabled={confirmLoading}
        fullWidth
        label={tOrganizations("actions.deleteOrganization.typeName", { name })}
        onChange={({ target }) => setTypedName(target.value)}
        size="small"
        value={typedName}
      />
    </StyledStack>
  );
};

export default DeleteOrganizationConfirm;
