"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";

import { useCancelDialog } from "@/hooks/useCancelDialog";

import { Button, DialogActions } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { getErrorMessage } from "@/utils/errors";

interface CustomizedDialogActionsProps {
  confirmDisabled?: boolean;
}

const CustomizedDialogActions = ({
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

  const handleCancel = useCancelDialog();

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
          onClick={handleCancel}
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

export default CustomizedDialogActions;
