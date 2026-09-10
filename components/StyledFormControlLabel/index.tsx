// https://mui.com/material-ui/react-radio-button/#UseRadioGroup.tsx

import { FormControlLabel, type FormControlLabelProps } from "@mui/material";
import { styled } from "@mui/material/styles";

export interface StyledFormControlLabelProps extends FormControlLabelProps {
  checked: boolean;
}

const StyledFormControlLabel = styled((props: StyledFormControlLabelProps) => (
  <FormControlLabel {...props} />
))(({ theme }) => ({
  variants: [
    {
      props: { checked: true },
      style: {
        ".MuiFormControlLabel-label": {
          color: theme.palette.primary.main,
        },
      },
    },
  ],
}));

export default StyledFormControlLabel;
