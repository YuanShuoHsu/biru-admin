import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { LocaleEnum } from "@/enums/Locale";

import { type Locale, routing } from "@/i18n/routing";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_NEXT_URL,
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: {
        emailSubscribed: {
          type: "boolean",
          required: true,
          defaultValue: true,
        },
        firstName: {
          type: "string",
          required: true,
        },
        lang: {
          type: [...routing.locales],
          required: true,
          defaultValue: routing.defaultLocale,
        },
        lastName: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});

type ErrorTypes = Partial<
  Record<keyof typeof authClient.$ERROR_CODES, Record<Locale, string>>
>;

const customErrorCodes: Record<string, Record<Locale, string>> = {
  EMAIL_IS_ALREADY_VERIFIED: {
    [LocaleEnum.ZhTW]: "此信箱已完成驗證，請直接登入",
    [LocaleEnum.En]: "Email already verified. Please sign in.",
    [LocaleEnum.Ja]:
      "このメールアドレスは既に認証済みです。ログインしてください",
    [LocaleEnum.Ko]: "이미 인증된 이메일입니다. 로그인해 주세요",
    [LocaleEnum.ZhCN]: "此邮箱已完成验证，请直接登录",
  },
};

const errorCodes = {
  INVALID_EMAIL_OR_PASSWORD: {
    [LocaleEnum.ZhTW]: "電子郵件或密碼錯誤，請重新輸入",
    [LocaleEnum.En]: "Invalid email or password. Please try again.",
    [LocaleEnum.Ja]:
      "メールアドレスまたはパスワードが間違っています。再入力してください",
    [LocaleEnum.Ko]:
      "이메일 또는 비밀번호가 올바르지 않습니다. 다시 입력해 주세요",
    [LocaleEnum.ZhCN]: "电子邮件或密码错误，请重新输入",
  },
  INVALID_TOKEN: {
    [LocaleEnum.ZhTW]: "驗證連結無效或已過期，請重新寄送",
    [LocaleEnum.En]: "Invalid or expired verification link. Please resend.",
    [LocaleEnum.Ja]: "認証リンクが無効または期限切れです。再送してください",
    [LocaleEnum.Ko]: "유효하지 않거나 만료된 인증 링크입니다. 다시 보내주세요",
    [LocaleEnum.ZhCN]: "验证链接无效或已过期，请重新发送",
  },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    [LocaleEnum.ZhTW]: "此帳號已被註冊，請使用其他信箱",
    [LocaleEnum.En]: "User already registered. Please use another email.",
    [LocaleEnum.Ja]:
      "このユーザーは既に登録されています。別のメールアドレスを使用してください",
    [LocaleEnum.Ko]: "이미 등록된 사용자입니다. 다른 이메일을 사용해 주세요",
    [LocaleEnum.ZhCN]: "此账号已被注册，请使用其他邮箱",
  },
} satisfies ErrorTypes;

export const getErrorMessage = (code: string, locale: Locale) => {
  if (code in errorCodes)
    return errorCodes[code as keyof typeof errorCodes][locale];
  if (code in customErrorCodes) return customErrorCodes[code][locale];

  return "";
};
