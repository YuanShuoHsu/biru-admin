// https://mui.com/material-ui/react-avatar/#UploadAvatars.tsx
// https://mui.com/material-ui/react-button/#InputFileUpload.tsx

import imageCompression, { type Options } from "browser-image-compression";

import BadgeAvatars from "@/components/BadgeAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { CameraAlt, Close, RestartAlt } from "@mui/icons-material";
import {
  Avatar,
  ButtonBase,
  IconButton,
  type ButtonBaseProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useUploadAvatarStore } from "@/providers/upload-avatar-store-provider";

interface ShapeProps {
  aspectRatio: string;
  fullWidth: boolean;
  shape: "circle" | "square";
}

const StyledButtonBase = styled(ButtonBase, {
  shouldForwardProp: (prop) =>
    prop !== "aspectRatio" && prop !== "fullWidth" && prop !== "shape",
})<ButtonBaseProps & ShapeProps>(({ fullWidth, shape, theme }) => ({
  borderRadius: shape === "square" ? theme.shape.borderRadius : "50%",
  ...(fullWidth && {
    width: "100%",

    "& .MuiBadge-root": { width: "100%" },
  }),

  "&:has(:focus-visible)": {
    outline: "2px solid",
    outlineOffset: "2px",
  },
}));

const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) =>
    prop !== "aspectRatio" && prop !== "fullWidth" && prop !== "shape",
})<ShapeProps>(({ aspectRatio, fullWidth, shape, theme }) => ({
  width: "100%",
  maxWidth: fullWidth ? "100%" : "100px",
  height: "auto",
  aspectRatio,
  borderRadius: shape === "square" ? theme.shape.borderRadius : "50%",
}));

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
  aspectRatio?: string;
  fullWidth?: boolean;
  initialSrc?: string | null;
  shape?: "circle" | "square";
  uploadKey: string;
}

const UploadAvatars = ({
  aspectRatio = "1/1",
  fullWidth = false,
  initialSrc,
  shape = "circle",
  uploadKey,
}: UploadAvatarsProps) => {
  const { resetAvatarSrc, setAvatarSrc } = useUploadAvatarStore(
    (state) => state,
  );
  const avatarSrc = useUploadAvatarSrc(uploadKey, initialSrc);
  const canRestore = !!initialSrc && avatarSrc !== initialSrc;

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

    const reader = new FileReader();
    reader.onload = () => setAvatarSrc(uploadKey, reader.result as string);
    reader.readAsDataURL(compressed);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault();

    setAvatarSrc(uploadKey, undefined);
  };

  const handleRestoreAvatar = (e: React.MouseEvent) => {
    e.preventDefault();

    resetAvatarSrc(uploadKey);
  };

  const { Icon, label, onClick } = avatarSrc
    ? { Icon: Close, label: "remove avatar", onClick: handleRemoveAvatar }
    : { Icon: CameraAlt, label: "upload avatar", onClick: undefined };

  return (
    <StyledButtonBase
      aria-label="Avatar image"
      aspectRatio={aspectRatio}
      component="label"
      fullWidth={fullWidth}
      role={undefined}
      shape={shape}
      tabIndex={-1}
    >
      <BadgeAvatars
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        badgeContent={
          canRestore ? (
            <IconButton
              aria-label="restore avatar"
              component="span"
              onClick={handleRestoreAvatar}
              role={undefined}
              size="small"
              tabIndex={-1}
            >
              <RestartAlt fontSize="inherit" />
            </IconButton>
          ) : null
        }
      >
        <BadgeAvatars
          badgeContent={
            <IconButton
              aria-label={label}
              component="span"
              onClick={onClick}
              role={undefined}
              size="small"
              tabIndex={-1}
            >
              <Icon fontSize="inherit" />
            </IconButton>
          }
        >
          <StyledAvatar
            alt="Upload new avatar"
            aspectRatio={aspectRatio}
            fullWidth={fullWidth}
            shape={shape}
            src={avatarSrc}
          />
          <VisuallyHiddenInput
            accept="image/*"
            onChange={handleAvatarChange}
            type="file"
          />
        </BadgeAvatars>
      </BadgeAvatars>
    </StyledButtonBase>
  );
};

export default UploadAvatars;
