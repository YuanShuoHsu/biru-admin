// https://mui.com/material-ui/react-dialog/#FormDialog.tsx
// https://mui.com/material-ui/react-dialog/#system-CustomizedDialogs.tsx

"use client";

import CustomizedDialogActions from "@/components/CustomizedDialogs/Actions";
import CustomizedDialogContent from "@/components/CustomizedDialogs/Content";
import Transition from "@/components/CustomizedDialogs/Transition";

import { useCancelDialog } from "@/hooks/useCancelDialog";

import { Close } from "@mui/icons-material";
import { Dialog, DialogTitle, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";
import { useUploadAvatarStore } from "@/providers/upload-avatar-store-provider";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(2),
  overflowWrap: "anywhere",
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: 8,
  top: 8,
  color: theme.palette.grey[500],
}));

const CustomizedDialogs = () => {
  const {
    body,
    container,
    content,
    contentText,
    maxWidth,
    onExited,
    open,
    resetDialog,
    title,
  } = useDialogStore((state) => state);
  const { resetUploadAvatar } = useUploadAvatarStore((state) => state);

  const handleCancel = useCancelDialog();

  const handleExited = () => {
    resetDialog();
    resetUploadAvatar();
    onExited?.();
  };

  return (
    <BootstrapDialog
      aria-labelledby="customized-dialog-title"
      aria-describedby={
        contentText ? "customized-dialog-description" : undefined
      }
      container={container}
      fullWidth
      maxWidth={maxWidth}
      onClose={handleCancel}
      open={open}
      scroll="body"
      slotProps={{ transition: { onExited: handleExited } }}
      slots={{ transition: Transition }}
    >
      <StyledDialogTitle id="customized-dialog-title">
        {title}
      </StyledDialogTitle>
      <StyledIconButton aria-label="close" onClick={handleCancel}>
        <Close />
      </StyledIconButton>
      {body ?? (
        <>
          <CustomizedDialogContent>{content}</CustomizedDialogContent>
          <CustomizedDialogActions />
        </>
      )}
    </BootstrapDialog>
  );
};

export default CustomizedDialogs;
