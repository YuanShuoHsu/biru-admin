import type { ComponentProps } from "react";

import { styled } from "@mui/material/styles";

const StyledForm = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-novalidate
const FormBox = (props: ComponentProps<typeof StyledForm>) => (
  <StyledForm noValidate {...props} />
);

export default FormBox;
