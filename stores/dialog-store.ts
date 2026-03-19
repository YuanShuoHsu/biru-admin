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
  open: boolean;
  title: string;
};

type DialogActions = {
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
  open: false,
  title: "",
};

export const createDialogStore = (
  initState: DialogState = defaultInitState,
) => {
  return createStore<DialogStore>()((set) => ({
    ...initState,
    resetDialog: () => set(() => ({ ...defaultInitState })),
    setDialog: (options) =>
      set((state) => ({
        ...state,
        ...options,
      })),
  }));
};
