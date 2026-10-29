// https://mui.com/material-ui/react-dialog/#FormDialog.tsx
// https://mui.com/material-ui/react-dialog/#system-CustomizedDialogs.tsx

"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";

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
import { useUploadAvatarStore } from "@/providers/upload-avatar-store-provider";

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
  overflowWrap: "anywhere",
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: 8,
  top: 8,
  color: theme.palette.grey[500],
}));

const useHandleClose = () => {
  const { cancelLoading, closeDialog, confirmLoading, onCancel, setDialog } =
    useDialogStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  return async () => {
    if (cancelLoading || confirmLoading) return;

    setDialog({ cancelLoading: true });

    try {
      await onCancel?.();
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ cancelLoading: false });
    }
  };
};

interface CustomizedDialogContentProps {
  children?: React.ReactNode;
}

export const CustomizedDialogContent = ({
  children,
}: CustomizedDialogContentProps) => {
  const { contentText } = useDialogStore((state) => state);

  return (
    <DialogContent dividers>
      {contentText && (
        <DialogContentText id="customized-dialog-description">
          {contentText}
        </DialogContentText>
      )}
      {children}
    </DialogContent>
  );
};

interface CustomizedDialogActionsProps {
  confirmDisabled?: boolean;
}

export const CustomizedDialogActions = ({
  confirmDisabled = false,
}: CustomizedDialogActionsProps) => {
  const {
    cancelLoading,
    cancelText,
    closeDialog,
    confirmLoading,
    confirmText,
    formId,
    onConfirm,
    setDialog,
    showCancel,
    showConfirm,
  } = useDialogStore((state) => state);

  const handleClose = useHandleClose();

  const { enqueueSnackbar } = useSnackbar();

  const tDialog = useTranslations("dialog");

  const handleConfirm = async () => {
    if (cancelLoading || confirmLoading) return;

    setDialog({ confirmLoading: true });

    try {
      await onConfirm?.();
      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
    }
  };

  return (
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
          autoFocus={!formId}
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
  );
};

const CustomizedDialogs = () => {
  const {
    body,
    container,
    content,
    contentText,
    maxWidth,
    onExited,
    open,
    resetDialog,
    title,
  } = useDialogStore((state) => state);
  const { resetUploadAvatar } = useUploadAvatarStore((state) => state);

  const handleClose = useHandleClose();

  const handleExited = () => {
    resetDialog();
    resetUploadAvatar();
    onExited?.();
  };

  return (
    <BootstrapDialog
      aria-labelledby="customized-dialog-title"
      aria-describedby={
        contentText ? "customized-dialog-description" : undefined
      }
      container={container}
      fullWidth
      maxWidth={maxWidth}
      onClose={handleClose}
      open={open}
      scroll="body"
      slotProps={{ transition: { onExited: handleExited } }}
      slots={{ transition: Transition }}
    >
      <StyledDialogTitle id="customized-dialog-title">
        {title}
      </StyledDialogTitle>
      <StyledIconButton aria-label="close" onClick={handleClose}>
        <Close />
      </StyledIconButton>
      {body ?? (
        <>
          <CustomizedDialogContent>{content}</CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      )}
    </BootstrapDialog>
  );
};

export default CustomizedDialogs;
