import { createStore } from "zustand/vanilla";

type UploadAvatarState = {
  avatarSrcs: Record<string, string | null | undefined>;
};

type UploadAvatarActions = {
  resetUploadAvatar: () => void;
  resetAvatarSrc: (key: string) => void;
  setAvatarSrc: (key: string, src?: string | null) => void;
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
    resetUploadAvatar: () => set(() => ({ ...defaultInitState })),
    resetAvatarSrc: (key) =>
      set((state) => {
        if (!(key in state.avatarSrcs)) return state;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _, ...rest } = state.avatarSrcs;

        return { avatarSrcs: rest };
      }),
    setAvatarSrc: (key, src) =>
      set((state) => ({
        avatarSrcs: { ...state.avatarSrcs, [key]: src },
      })),
  }));
};
