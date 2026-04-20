import { useUploadAvatarStore } from "@/providers/upload-avatar-store-provider";

export const useUploadAvatarSrc = (
  uploadKey: string,
  initialSrc?: string | null,
) => {
  const { avatarSrcs } = useUploadAvatarStore((state) => state);

  return uploadKey in avatarSrcs
    ? avatarSrcs[uploadKey]
    : initialSrc || undefined;
};
