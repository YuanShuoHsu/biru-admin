// https://mui.com/material-ui/react-text-field/#FormattedInputs.tsx

import React from "react";
import { IMaskInput } from "react-imask";

interface CustomProps {
  mask: string;
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
  placeholder?: string;
  uppercase?: boolean;
}

const TextMaskCustom = React.forwardRef<HTMLInputElement, CustomProps>(
  function TextMaskCustom(props, ref) {
    const { onChange, uppercase, ...other } = props;

    return (
      <IMaskInput
        {...other}
        inputRef={ref}
        onAccept={(value: string) =>
          onChange({ target: { name: props.name, value } })
        }
        overwrite
        {...(uppercase && { prepare: (str: string) => str.toUpperCase() })}
      />
    );
  },
);

export default TextMaskCustom;
