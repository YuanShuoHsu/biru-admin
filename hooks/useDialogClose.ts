import { useSnackbar } from "notistack";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { getErrorMessage } from "@/utils/errors";

export const useDialogClose = () => {
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
