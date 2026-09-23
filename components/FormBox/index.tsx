import { styled } from "@mui/material/styles";

const FormBox = styled("form")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export default FormBox;
