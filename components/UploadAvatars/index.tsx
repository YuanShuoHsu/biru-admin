// https://mui.com/material-ui/react-avatar/#UploadAvatars.tsx
// https://mui.com/material-ui/react-button/#InputFileUpload.tsx

import imageCompression, { type Options } from "browser-image-compression";

import BadgeAvatars from "@/components/BadgeAvatars";

import { CameraAlt, Close } from "@mui/icons-material";
import {
  Avatar,
  ButtonBase,
  IconButton,
  type ButtonBaseProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useUploadAvatarStore } from "@/providers/upload-avatar-store-provider";

const StyledButtonBase = styled(ButtonBase)<ButtonBaseProps>({
  borderRadius: "50%",

  "&:has(:focus-visible)": {
    outline: "2px solid",
    outlineOffset: "2px",
  },
});

const StyledAvatar = styled(Avatar)({
  width: "100%",
  maxWidth: "100px",
  height: "auto",
  aspectRatio: "1/1",
});

const VisuallyHiddenInput = styled("input")({
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
});

const COMPRESSION_OPTIONS: Options = {
  maxSizeMB: 0.02,
  maxWidthOrHeight: 512,
  fileType: "image/jpeg",
  initialQuality: 0.8,
  useWebWorker: true,
};

interface UploadAvatarsProps {
  uploadKey: string;
  initialSrc?: string | null;
}

const UploadAvatars = ({ uploadKey, initialSrc }: UploadAvatarsProps) => {
  const { avatarSrcs, setAvatarSrc } = useUploadAvatarStore((state) => state);
  const storedSrc = avatarSrcs[uploadKey];
  const hasInteracted = useUploadAvatarStore(
    (state) => uploadKey in state.avatarSrcs,
  );
  const avatarSrc = hasInteracted ? storedSrc : initialSrc || undefined;

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

      const reader = new FileReader();
      reader.onload = () => setAvatarSrc(uploadKey, reader.result as string);
      reader.readAsDataURL(compressed);
    }
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault();

    setAvatarSrc(uploadKey, undefined);
  };

  const { Icon, label, onClick } = avatarSrc
    ? { Icon: Close, label: "remove avatar", onClick: handleRemoveAvatar }
    : { Icon: CameraAlt, label: "upload avatar", onClick: undefined };

  return (
    <StyledButtonBase
      aria-label="Avatar image"
      component="label"
      role={undefined}
      tabIndex={-1}
    >
      <BadgeAvatars
        badgeContent={
          <IconButton
            aria-label={label}
            component="span"
            size="small"
            onClick={onClick}
          >
            <Icon fontSize="inherit" />
          </IconButton>
        }
      >
        <StyledAvatar alt="Upload new avatar" src={avatarSrc} />
        <VisuallyHiddenInput
          accept="image/*"
          onChange={handleAvatarChange}
          type="file"
        />
      </BadgeAvatars>
    </StyledButtonBase>
  );
};

export default UploadAvatars;
