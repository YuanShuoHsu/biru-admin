// https://mui.com/material-ui/react-dialog/#FormDialog.tsx
// https://mui.com/material-ui/react-dialog/#system-CustomizedDialogs.tsx

"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { useState } from "react";

import Transition from "@/components/CustomizedDialogs/Transition";

import { Close } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { getErrorMessage } from "@/utils/errors";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: 8,
  top: 8,
  color: theme.palette.grey[500],
}));

const CustomizedDialogs = () => {
  const [cancelLoading, setCancelLoading] = useState(false);

  const {
    cancelText,
    confirmDisabled,
    confirmLoading,
    confirmText,
    content,
    contentText,
    formId,
    onCancel,
    onConfirm,
    open,
    resetDialog,
    setDialog,
    showCancel,
    showConfirm,
    title,
  } = useDialogStore((state) => state);

  const loading = cancelLoading || confirmLoading;

  const { enqueueSnackbar } = useSnackbar();

  const tDialog = useTranslations("dialog");

  const handleClose = async () => {
    if (loading) return;

    setCancelLoading(true);

    try {
      await onCancel?.();
      resetDialog();
    } catch (error) {
      const message = getErrorMessage(error);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (loading) return;

    setDialog({ confirmLoading: true });

    try {
      await onConfirm?.();
      resetDialog();
    } catch (error) {
      const message = getErrorMessage(error);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
    }
  };

  return (
    <BootstrapDialog
      aria-labelledby="customized-dialog-title"
      aria-describedby={
        contentText ? "customized-dialog-description" : undefined
      }
      fullWidth
      onClose={handleClose}
      open={open}
      scroll="body"
      slots={{ transition: Transition }}
    >
      <StyledDialogTitle id="customized-dialog-title">
        {title}
      </StyledDialogTitle>
      <StyledIconButton aria-label="close" onClick={handleClose}>
        <Close />
      </StyledIconButton>
      <DialogContent dividers>
        {contentText && (
          <DialogContentText id="customized-dialog-description">
            {contentText}
          </DialogContentText>
        )}
        {content}
      </DialogContent>
      <DialogActions>
        {showCancel && (
          <Button
            loading={cancelLoading}
            loadingPosition="end"
            onClick={handleClose}
          >
            {cancelText || tDialog("cancel")}
          </Button>
        )}
        {showConfirm && (
          <Button
            autoFocus
            disabled={confirmDisabled}
            form={formId}
            loading={confirmLoading}
            loadingPosition="end"
            onClick={formId ? undefined : handleConfirm}
            type={formId ? "submit" : "button"}
          >
            {confirmText || tDialog("confirm")}
          </Button>
        )}
      </DialogActions>
    </BootstrapDialog>
  );
};

export default CustomizedDialogs;
