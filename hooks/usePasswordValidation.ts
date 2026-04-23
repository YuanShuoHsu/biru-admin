import { useTranslations } from "next-intl";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

export const usePasswordValidation = (
  password: string,
  confirmPassword: string,
  currentPassword?: string,
) => {
  const tValidation = useTranslations("validation");

  const hasPassword = password.length > 0;
  const hasConfirmPassword = confirmPassword.length > 0;
  const passwordsMatch = hasPassword && password === confirmPassword;

  const passwordRules = [
    {
      key: "minLength",
      passed: password.length >= PASSWORD_MIN_LENGTH,
      label: tValidation("password.minLength"),
    },
    {
      key: "letter",
      passed: /[a-zA-Z]/.test(password),
      label: tValidation("password.letter"),
    },
    {
      key: "number",
      passed: /\d/.test(password),
      label: tValidation("password.number"),
    },
    ...(currentPassword !== undefined
      ? [
          {
            key: "differentFromCurrent",
            passed: hasPassword && currentPassword !== password,
            label: tValidation("newPassword.differentFromCurrent"),
          },
        ]
      : []),
  ];

  const confirmPasswordRules = [
    {
      key: "match",
      passed: passwordsMatch,
      label:
        currentPassword !== undefined
          ? tValidation("newPassword.match")
          : tValidation("password.match"),
    },
  ];

  const isPasswordError =
    hasPassword && passwordRules.some(({ passed }) => !passed);
  const isConfirmPasswordError =
    hasConfirmPassword && confirmPasswordRules.some(({ passed }) => !passed);

  return {
    hasPassword,
    hasConfirmPassword,
    passwordRules,
    confirmPasswordRules,
    isPasswordError,
    isConfirmPasswordError,
  };
};
