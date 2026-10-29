"use client";

import { DialogContent, DialogContentText } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

interface CustomizedDialogContentProps {
  children?: React.ReactNode;
}

const CustomizedDialogContent = ({
  children,
}: CustomizedDialogContentProps) => {
  const { contentText } = useDialogStore((state) => state);

  return (
    <DialogContent dividers>
      {contentText && (
        <DialogContentText id="customized-dialog-description">
          {contentText}
        </DialogContentText>
      )}
      {children}
    </DialogContent>
  );
};

export default CustomizedDialogContent;
