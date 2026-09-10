import { Box, type BoxProps } from "@mui/material";

const FormBox = ({ ref, ...props }: BoxProps<"form">) => (
  <Box
    ref={ref}
    component="form"
    display="flex"
    flexDirection="column"
    gap={2}
    {...props}
  />
);

FormBox.displayName = "FormBox";

export default FormBox;
