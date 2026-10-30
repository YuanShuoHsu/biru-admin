// https://mui.com/material-ui/react-dialog/#FormDialog.tsx
// https://mui.com/material-ui/react-dialog/#system-CustomizedDialogs.tsx

"use client";

import CustomizedDialogActions from "@/components/CustomizedDialogActions";
import Transition from "@/components/CustomizedDialogs/Transition";

import { useDialogClose } from "@/hooks/useDialogClose";

import { Close } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
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
    container,
    content,
    contentText,
    customLayout,
    maxWidth,
    onExited,
    open,
    resetDialog,
    title,
  } = useDialogStore((state) => state);
  const { resetUploadAvatar } = useUploadAvatarStore((state) => state);

  const handleClose = useDialogClose();

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
      onClose={handleClose}
      open={open}
      scroll="body"
      slotProps={{ transition: { onExited: handleExited } }}
      slots={{ transition: Transition }}
    >
      <StyledDialogTitle id="customized-dialog-title">
        {title}
      </StyledDialogTitle>
      <StyledIconButton aria-label="close" onClick={handleClose}>
        <Close />
      </StyledIconButton>
      {customLayout ? (
        content
      ) : (
        <>
          <DialogContent dividers>
            {contentText && (
              <DialogContentText id="customized-dialog-description">
                {contentText}
              </DialogContentText>
            )}
            {content}
          </DialogContent>
          <CustomizedDialogActions />
        </>
      )}
    </BootstrapDialog>
  );
};

export default CustomizedDialogs;
