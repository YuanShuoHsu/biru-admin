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
  names: string[];
}

const DeleteOrganizationConfirm = ({
  names,
}: DeleteOrganizationConfirmProps) => {
  const { confirmLoading, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");

  const [typedValue, setTypedValue] = useState("");

  const [name] = names;
  const isBatch = names.length > 1;
  const expected = isBatch ? String(names.length) : name;

  const matches = typedValue.trim() === expected;

  useEffect(() => {
    setDialog({ confirmDisabled: !matches });
  }, [matches, setDialog]);

  return (
    <StyledStack>
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
        <DialogContentText>
          {names.join(tCommon("delimiter"))}
        </DialogContentText>
      )}
      <TextField
        autoComplete="off"
        disabled={confirmLoading}
        fullWidth
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
        onChange={({ target }) => setTypedValue(target.value)}
        size="small"
        value={typedValue}
      />
    </StyledStack>
  );
};

export default DeleteOrganizationConfirm;
