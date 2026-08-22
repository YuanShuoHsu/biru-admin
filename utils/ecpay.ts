import type { CheckoutEcpayResponse } from "@/types/ecpay";

export const submitEcpayCheckout = ({
  action,
  fields,
}: CheckoutEcpayResponse) => {
  const form = document.createElement("form");
  form.acceptCharset = "UTF-8";
  form.method = "POST";
  form.action = action;

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
};
