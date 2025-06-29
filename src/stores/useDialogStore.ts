import { create } from "zustand";

interface DialogOptions {
  open: boolean;
  title?: string;
  content?: React.ReactNode;
  contentText?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => Promise<void>;
  onConfirm?: () => Promise<void>;
}

interface DialogState extends DialogOptions {
  setDialog: (options: DialogOptions) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  open: false,
  title: "",
  contentText: "",
  content: null,
  cancelText: "",
  confirmText: "",
  onCancel: undefined,
  onConfirm: undefined,
  setDialog: (options) =>
    set((state) => ({
      ...state,
      ...options,
    })),
}));
