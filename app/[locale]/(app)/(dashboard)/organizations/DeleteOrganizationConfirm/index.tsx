"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import CustomizedDialogActions from "@/components/CustomizedDialogActions";

import {
  DialogContent,
  DialogContentText,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const ConfirmStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

interface DeleteOrganizationConfirmProps {
  names: string[];
}

const DeleteOrganizationConfirm = ({
  names,
}: DeleteOrganizationConfirmProps) => {
  const { confirmLoading } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const [typedValue, setTypedValue] = useState("");

  const [name] = names;
  const isBatch = names.length > 1;
  const expected = isBatch ? String(names.length) : name;

  const matches = typedValue.trim() === expected;

  return (
    <>
      <DialogContent dividers>
        <StyledStack>
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
            fullWidth
            label={
              isBatch
                ? tOrganizations(
                    "actions.batchDeleteOrganization.submit.typeCount",
                    {
                      count: names.length,
                    },
                  )
                : tOrganizations("actions.deleteOrganization.typeName", {
                    name,
                  })
            }
            onChange={({ target }) => setTypedValue(target.value)}
            size="small"
            value={typedValue}
          />
        </StyledStack>
      </DialogContent>
      <CustomizedDialogActions confirmDisabled={!matches} />
    </>
  );
};

export default DeleteOrganizationConfirm;
