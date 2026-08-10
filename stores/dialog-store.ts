import { createStore } from "zustand/vanilla";

type DialogState = {
  cancelText?: string;
  confirmDisabled: boolean;
  confirmLoading: boolean;
  confirmText?: string;
  content?: React.ReactNode;
  contentText?: string;
  formId?: string;
  onCancel?: () => Promise<void>;
  onConfirm?: () => Promise<void>;
  onExited?: () => void;
  open: boolean;
  showCancel?: boolean;
  showConfirm?: boolean;
  title: React.ReactNode;
};

type DialogActions = {
  closeDialog: () => void;
  resetDialog: () => void;
  setDialog: (options: Partial<DialogState>) => void;
};

export type DialogStore = DialogState & DialogActions;

export const defaultInitState: DialogState = {
  cancelText: "",
  confirmDisabled: false,
  confirmLoading: false,
  confirmText: "",
  content: null,
  contentText: "",
  formId: undefined,
  onCancel: undefined,
  onConfirm: undefined,
  onExited: undefined,
  open: false,
  showCancel: true,
  showConfirm: true,
  title: "",
};

export const createDialogStore = (
  initState: DialogState = defaultInitState,
) => {
  return createStore<DialogStore>()((set) => ({
    ...initState,
    closeDialog: () => set({ open: false }),
    resetDialog: () => set(() => ({ ...defaultInitState })),
    setDialog: (options) =>
      set((state) => ({
        ...state,
        ...options,
      })),
  }));
};
