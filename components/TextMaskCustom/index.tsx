// https://mui.com/material-ui/react-text-field/#FormattedInputs.tsx

import type { CountryCode } from "libphonenumber-js";
import React, { useImperativeHandle, useRef } from "react";
import { IMaskInput } from "react-imask";

import { getPhoneFormatting } from "@/utils/countries";

interface CustomProps {
  countryCode: CountryCode;
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
}

interface InputElement {
  focus(): void;
  value?: string;
}

const TextMaskCustom = React.forwardRef<InputElement, CustomProps>(
  function TextMaskCustom({ countryCode, name, onChange, ...other }, ref) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const { mask, placeholder } = getPhoneFormatting(countryCode);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        get value() {
          return inputRef.current?.value;
        },
      }),
      [],
    );

    return (
      <IMaskInput
        {...other}
        inputRef={inputRef}
        mask={mask}
        name={name}
        onAccept={(value: string) => onChange({ target: { name, value } })}
        overwrite
        placeholder={placeholder}
      />
    );
  },
);

export default TextMaskCustom;
