// https://mui.com/material-ui/react-text-field/#FormattedInputs.tsx

import React from "react";
import { IMaskInput } from "react-imask";

interface CustomProps {
  mask: string;
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
  placeholder?: string;
}

const TextMaskCustom = React.forwardRef<HTMLInputElement, CustomProps>(
  function TextMaskCustom({ name, onChange, ...other }, ref) {
    return (
      <IMaskInput
        {...other}
        inputRef={ref}
        name={name}
        onAccept={(value: string) => onChange({ target: { name, value } })}
        overwrite
      />
    );
  },
);

export default TextMaskCustom;
