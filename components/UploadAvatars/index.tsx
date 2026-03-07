// https://mui.com/material-ui/react-avatar/#UploadAvatars.tsx
// https://mui.com/material-ui/react-button/#InputFileUpload.tsx

import { forwardRef, useImperativeHandle, useState } from "react";

import { CameraAlt } from "@mui/icons-material";
import {
  Avatar,
  ButtonBase,
  IconButton,
  type ButtonBaseProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import BadgeAvatars from "../BadgeAvatars";

const StyledButtonBase = styled(ButtonBase)<ButtonBaseProps>({
  borderRadius: "50%",

  "&:has(:focus-visible)": {
    outline: "2px solid",
    outlineOffset: "2px",
  },
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: "100%",
  maxWidth: "100px",
  height: "auto",
  aspectRatio: "1/1",
  transition: theme.transitions.create(["background-color"]),
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

export interface UploadAvatarsHandle {
  getValue: () => { avatarSrc?: string };
}

const UploadAvatars = forwardRef<UploadAvatarsHandle>((_, ref) => {
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);

  useImperativeHandle(ref, () => ({
    getValue: () => ({
      avatarSrc,
    }),
  }));

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <StyledButtonBase
      aria-label="Avatar image"
      component="label"
      role={undefined}
      tabIndex={-1}
    >
      <BadgeAvatars
        badgeContent={
          <IconButton aria-label="cameraAlt" component="span" size="small">
            <CameraAlt fontSize="inherit" />
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
});

UploadAvatars.displayName = "UploadAvatars";

export default UploadAvatars;
