import {
  adminClient,
  inferAdditionalFields,
  multiSessionClient,
  organizationClient,
} from "better-auth/client/plugins";
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
    multiSessionClient(),
    organizationClient(),
  ],
});

type ErrorTypes = Partial<
  Record<keyof typeof authClient.$ERROR_CODES, Record<Locale, string>>
>;

const customErrorCodes: Record<string, Record<Locale, string>> = {
  BANNED_USER: {
    [LocaleEnum.ZhTW]: "您的帳號已被停用，請聯繫管理員",
    [LocaleEnum.En]:
      "Your account has been banned. Please contact an administrator.",
    [LocaleEnum.Ja]:
      "アカウントが停止されています。管理者にお問い合わせください",
    [LocaleEnum.Ko]: "계정이 정지되었습니다. 관리자에게 문의해 주세요",
    [LocaleEnum.ZhCN]: "您的账号已被停用，请联系管理员",
  },
  EMAIL_IS_ALREADY_VERIFIED: {
    [LocaleEnum.ZhTW]: "此信箱已完成驗證，請直接登入",
    [LocaleEnum.En]: "Email already verified. Please sign in.",
    [LocaleEnum.Ja]:
      "このメールアドレスは既に認証済みです。ログインしてください",
    [LocaleEnum.Ko]: "이미 인증된 이메일입니다. 로그인해 주세요",
    [LocaleEnum.ZhCN]: "此邮箱已完成验证，请直接登录",
  },
  EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION: {
    [LocaleEnum.ZhTW]: "請先驗證信箱後再接受邀請",
    [LocaleEnum.En]: "Email verification required before accepting invitation.",
    [LocaleEnum.Ja]: "招待を受け入れる前にメール認証が必要です",
    [LocaleEnum.Ko]: "초대를 수락하기 전에 이메일 인증이 필요합니다",
    [LocaleEnum.ZhCN]: "请先验证邮箱后再接受邀请",
  },
  FAILED_TO_UNLINK_LAST_ACCOUNT: {
    [LocaleEnum.ZhTW]: "無法解除最後一個登入方式",
    [LocaleEnum.En]: "Cannot unlink the last login method.",
    [LocaleEnum.Ja]: "最後のログイン方法は解除できません",
    [LocaleEnum.Ko]: "마지막 로그인 방법은 연결 해제할 수 없습니다",
    [LocaleEnum.ZhCN]: "无法解除最后一个登录方式",
  },
  INVITATION_NOT_FOUND: {
    [LocaleEnum.ZhTW]: "邀請連結無效或已過期",
    [LocaleEnum.En]: "Invitation not found or has expired.",
    [LocaleEnum.Ja]: "招待が見つからないか、有効期限が切れています",
    [LocaleEnum.Ko]: "초대를 찾을 수 없거나 만료되었습니다",
    [LocaleEnum.ZhCN]: "邀请链接无效或已过期",
  },
  MEMBER_NOT_FOUND: {
    [LocaleEnum.ZhTW]: "找不到該成員",
    [LocaleEnum.En]: "Member not found.",
    [LocaleEnum.Ja]: "メンバーが見つかりません",
    [LocaleEnum.Ko]: "멤버를 찾을 수 없습니다",
    [LocaleEnum.ZhCN]: "找不到该成员",
  },
  NO_ACTIVE_ORGANIZATION: {
    [LocaleEnum.ZhTW]: "您的帳號無權限存取後台，請聯繫管理員",
    [LocaleEnum.En]:
      "Your account does not have access to the admin panel. Please contact your administrator.",
    [LocaleEnum.Ja]:
      "このアカウントには管理画面へのアクセス権限がありません。管理者にお問い合わせください。",
    [LocaleEnum.Ko]:
      "이 계정은 관리자 패널에 접근할 권한이 없습니다. 관리자에게 문의하세요.",
    [LocaleEnum.ZhCN]: "您的账号无权访问后台，请联系管理员",
  },
  ORGANIZATION_ALREADY_EXISTS: {
    [LocaleEnum.ZhTW]: "此組織已存在",
    [LocaleEnum.En]: "Organization already exists",
    [LocaleEnum.Ja]: "この組織は既に存在します",
    [LocaleEnum.Ko]: "이미 존재하는 조직입니다",
    [LocaleEnum.ZhCN]: "此组织已存在",
  },
  ORGANIZATION_SLUG_ALREADY_TAKEN: {
    [LocaleEnum.ZhTW]: "此識別碼已被使用，請換一個",
    [LocaleEnum.En]: "This slug is already taken. Please choose another.",
    [LocaleEnum.Ja]:
      "このスラッグは既に使用されています。別のものを選んでください",
    [LocaleEnum.Ko]: "이미 사용 중인 슬러그입니다. 다른 것을 선택해 주세요",
    [LocaleEnum.ZhCN]: "此标识符已被使用，请换一个",
  },
  UNAUTHORIZED: {
    [LocaleEnum.ZhTW]: "請先登入",
    [LocaleEnum.En]: "Please sign in first",
    [LocaleEnum.Ja]: "先にログインしてください",
    [LocaleEnum.Ko]: "먼저 로그인해 주세요",
    [LocaleEnum.ZhCN]: "请先登录",
  },
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: {
    [LocaleEnum.ZhTW]: "此用戶已是該組織的成員",
    [LocaleEnum.En]: "User is already a member of this organization.",
    [LocaleEnum.Ja]: "このユーザーは既にこの組織のメンバーです",
    [LocaleEnum.Ko]: "이 사용자는 이미 이 조직의 멤버입니다",
    [LocaleEnum.ZhCN]: "此用户已是该组织的成员",
  },
  USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION: {
    [LocaleEnum.ZhTW]: "此用戶已被邀請至該組織",
    [LocaleEnum.En]: "User is already invited to this organization.",
    [LocaleEnum.Ja]: "このユーザーは既にこの組織に招待されています",
    [LocaleEnum.Ko]: "이 사용자는 이미 이 조직에 초대되었습니다",
    [LocaleEnum.ZhCN]: "此用户已被邀请至该组织",
  },
  VALIDATION_ERROR: {
    [LocaleEnum.ZhTW]: "資料驗證失敗",
    [LocaleEnum.En]: "Validation Error",
    [LocaleEnum.Ja]: "バリデーションエラー",
    [LocaleEnum.Ko]: "유효성 검사 오류",
    [LocaleEnum.ZhCN]: "数据验证失败",
  },
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION: {
    [LocaleEnum.ZhTW]: "您沒有權限刪除此組織",
    [LocaleEnum.En]: "You are not allowed to delete this organization.",
    [LocaleEnum.Ja]: "この組織を削除する権限がありません",
    [LocaleEnum.Ko]: "이 조직을 삭제할 권한이 없습니다",
    [LocaleEnum.ZhCN]: "您没有权限删除此组织",
  },
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER: {
    [LocaleEnum.ZhTW]: "您沒有權限更新此成員",
    [LocaleEnum.En]: "You are not allowed to update this member.",
    [LocaleEnum.Ja]: "このメンバーを更新する権限がありません",
    [LocaleEnum.Ko]: "이 멤버를 업데이트할 권한이 없습니다",
    [LocaleEnum.ZhCN]: "您没有权限更新此成员",
  },
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION: {
    [LocaleEnum.ZhTW]: "您沒有權限更新此組織",
    [LocaleEnum.En]: "You are not allowed to update this organization.",
    [LocaleEnum.Ja]: "この組織を更新する権限がありません",
    [LocaleEnum.Ko]: "이 조직을 업데이트할 권한이 없습니다",
    [LocaleEnum.ZhCN]: "您没有权限更新此组织",
  },
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: {
    [LocaleEnum.ZhTW]: "此邀請不是發給您的",
    [LocaleEnum.En]: "You are not the recipient of this invitation.",
    [LocaleEnum.Ja]: "この招待はあなた宛ではありません",
    [LocaleEnum.Ko]: "이 초대는 귀하를 위한 것이 아닙니다",
    [LocaleEnum.ZhCN]: "此邀请不是发给您的",
  },
  YOU_CANNOT_BAN_YOURSELF: {
    [LocaleEnum.ZhTW]: "您無法封鎖自己",
    [LocaleEnum.En]: "You cannot ban yourself.",
    [LocaleEnum.Ja]: "自分自身を停止することはできません",
    [LocaleEnum.Ko]: "자기 자신을 차단할 수 없습니다",
    [LocaleEnum.ZhCN]: "您无法封禁自己",
  },
  YOU_CANNOT_IMPERSONATE_ADMINS: {
    [LocaleEnum.ZhTW]: "無法模擬管理員帳號",
    [LocaleEnum.En]: "You cannot impersonate admin users.",
    [LocaleEnum.Ja]: "管理者アカウントをなりすましすることはできません",
    [LocaleEnum.Ko]: "관리자 계정을 가장할 수 없습니다",
    [LocaleEnum.ZhCN]: "无法模拟管理员账号",
  },
  YOU_CANNOT_REMOVE_YOURSELF: {
    [LocaleEnum.ZhTW]: "您無法移除自己",
    [LocaleEnum.En]: "You cannot remove yourself.",
    [LocaleEnum.Ja]: "自分自身を削除することはできません",
    [LocaleEnum.Ko]: "자기 자신을 삭제할 수 없습니다",
    [LocaleEnum.ZhCN]: "您无法移除自己",
  },
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER: {
    [LocaleEnum.ZhTW]: "您是唯一的擁有者，無法離開組織",
    [LocaleEnum.En]: "You cannot leave the organization as the only owner.",
    [LocaleEnum.Ja]: "唯一のオーナーのため、組織を退出できません",
    [LocaleEnum.Ko]: "유일한 소유자이므로 조직을 탈퇴할 수 없습니다",
    [LocaleEnum.ZhCN]: "您是唯一的拥有者，无法离开组织",
  },
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER: {
    [LocaleEnum.ZhTW]: "請先轉移擁有者權限，再離開組織",
    [LocaleEnum.En]:
      "Please transfer ownership before leaving the organization.",
    [LocaleEnum.Ja]: "組織を退出する前に、オーナー権限を移譲してください",
    [LocaleEnum.Ko]: "조직을 탈퇴하기 전에 소유권을 이전해 주세요",
    [LocaleEnum.ZhCN]: "请先转移拥有者权限，再离开组织",
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
  INVALID_PASSWORD: {
    [LocaleEnum.ZhTW]: "目前密碼錯誤，請重新輸入",
    [LocaleEnum.En]: "Invalid password. Please try again.",
    [LocaleEnum.Ja]: "現在のパスワードが間違っています。再入力してください",
    [LocaleEnum.Ko]: "현재 비밀번호가 올바르지 않습니다. 다시 입력해 주세요",
    [LocaleEnum.ZhCN]: "目前密码错误，请重新输入",
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
