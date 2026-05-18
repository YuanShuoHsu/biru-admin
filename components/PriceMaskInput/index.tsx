// https://mui.com/material-ui/react-text-field/#FormattedInputs.tsx

import React, { useImperativeHandle, useRef } from "react";
import { IMaskInput, type IMaskInputProps } from "react-imask";

interface CustomProps {
  name: string;
  onChange: (event: { target: { name: string; value: string } }) => void;
}

interface InputElement {
  focus(): void;
  value?: string;
}

const PriceMaskInput = React.forwardRef<InputElement, CustomProps>(
  function PriceMaskInput({ name, onChange, ...other }, ref) {
    const inputRef = useRef<HTMLInputElement | null>(null);

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

    const maskProps = {
      ...other,
      inputRef,
      mask: Number,
      min: 1,
      name,
      onAccept: (_value: string, maskRef: { unmaskedValue: string }) =>
        onChange({ target: { name, value: maskRef.unmaskedValue } }),
      scale: 0,
      thousandsSeparator: ",",
    } as unknown as IMaskInputProps<HTMLInputElement>;

    return <IMaskInput {...maskProps} />;
  },
);

export default PriceMaskInput;
