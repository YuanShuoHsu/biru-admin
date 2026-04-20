import { createStore } from "zustand/vanilla";

type UploadAvatarState = {
  avatarSrcs: Record<string, string | undefined>;
};

type UploadAvatarActions = {
  setAvatarSrc: (key: string, src?: string) => void;
};

export type UploadAvatarStore = UploadAvatarState & UploadAvatarActions;

export const defaultInitState: UploadAvatarState = {
  avatarSrcs: {},
};

export const createUploadAvatarStore = (
  initState: UploadAvatarState = defaultInitState,
) => {
  return createStore<UploadAvatarStore>()((set) => ({
    ...initState,
    setAvatarSrc: (key, src) =>
      set((state) => ({
        avatarSrcs: { ...state.avatarSrcs, [key]: src },
      })),
  }));
};
