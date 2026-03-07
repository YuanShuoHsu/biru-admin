// https://mui.com/legal/privacy/
// https://vercel.com/legal/privacy-policy

import { LocaleEnum } from "@/enums/Locale";

import { type Locale, routing } from "@/i18n/routing";

import {
  Box,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

interface PrivacySection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface PrivacyContent {
  title: string;
  lastUpdated: string;
  intro: string;
  tocTitle: string;
  sections: PrivacySection[];
  contact: string;
}

const privacyByLocale: Record<Locale, PrivacyContent> = {
  [LocaleEnum.ZhTW]: {
    title: "Biru Coffee 隱私權政策",
    lastUpdated: "最近更新：2024/09/01",
    intro:
      "我們重視您的個人資料保護。本政策說明我們如何蒐集、使用、保護及分享您的資料，適用於您使用 Biru Coffee 的線上服務與相關功能。",
    tocTitle: "本頁目錄",
    sections: [
      {
        id: "s1",
        heading: "1. 蒐集的資料",
        paragraphs: ["我們可能依您使用情境蒐集以下資料："],
        bullets: [
          "帳號資訊：姓名、Email、電話等您提供的註冊/聯絡資料。",
          "交易資訊：訂單內容、取餐資訊、退款/取消紀錄等；付款相關敏感資訊由可信的第三方金流處理。",
          "裝置與使用紀錄：例如瀏覽行為、IP 位址、裝置識別資訊、錯誤/效能紀錄。",
          "偏好與互動：行銷偏好、客服對話或回饋內容（若您主動提供）。",
        ],
      },
      {
        id: "s2",
        heading: "2. 資料使用目的",
        paragraphs: ["我們可能基於以下目的使用您的資料："],
        bullets: [
          "提供與履行訂單、處理取消/退款與交易對帳。",
          "身份驗證、帳號管理與防止未經授權存取。",
          "客服支援、問題排查與服務通知。",
          "改善產品與體驗（例如統計分析、功能優化）。",
          "行銷溝通（僅於需要同意時取得同意後發送）。",
          "服務安全與防詐，以及遵循法律義務。",
        ],
      },
      {
        id: "s3",
        heading: "3. 資料分享對象",
        paragraphs: [
          "我們僅在提供服務所必需的範圍內分享您的資料，並要求合作夥伴採取合理的保護措施。",
        ],
        bullets: [
          "金流/支付：用於完成付款、退款與風險控管。",
          "雲端與基礎設施供應商：用於系統運行、儲存、監控與備援。",
          "行銷與訊息服務：在您同意或法律允許的情況下，用於發送通知或行銷訊息。",
          "依法要求：因法令、司法或主管機關要求而揭露。",
        ],
      },
      {
        id: "s4",
        heading: "4. 資料保存與安全",
        paragraphs: [
          "我們採取合理的技術與組織措施保護資料（例如存取控制、加密、稽核與監控）。",
          "我們會在達成目的所需期間或法定保存期間內保存資料，期滿後刪除或匿名化。請您也妥善保管登入資訊與裝置安全。",
        ],
      },
      {
        id: "s5",
        heading: "5. 您的權利",
        paragraphs: ["依適用法律，您可能享有以下權利："],
        bullets: [
          "查詢或請求閱覽、複製您的個資。",
          "請求補充或更正。",
          "請求刪除或停止蒐集、處理或利用（於法律允許範圍內）。",
          "撤回同意（不影響撤回前基於同意之處理合法性）。",
        ],
      },
      {
        id: "s6",
        heading: "6. 行銷與 Cookie",
        paragraphs: [
          "我們可能使用 Cookie 或類似技術以維持登入狀態、改善體驗與分析使用情況。",
          "您可透過瀏覽器或裝置設定管理 Cookie 偏好；部分功能可能因此受影響。個人化行銷將在取得同意後才會進行（如適用）。",
        ],
      },
      {
        id: "s7",
        heading: "7. 跨境傳輸",
        paragraphs: [
          "您的資料可能被傳輸並存放於我們或服務供應商所在地的伺服器。我們會採取適當的保護機制，並遵循當地法律規範。",
        ],
      },
      {
        id: "s8",
        heading: "8. 政策更新",
        paragraphs: [
          "我們可能不時更新本政策並於此頁公告；重大變更將另行通知（若法律要求）。持續使用服務即視為接受更新後的內容。",
        ],
      },
    ],
    contact:
      "如有任何隱私相關疑問或權利行使需求，請透過客服信箱或門市與我們聯繫。",
  },
  [LocaleEnum.ZhCN]: {
    title: "Biru Coffee 隐私权政策",
    lastUpdated: "最近更新：2024/09/01",
    intro:
      "我们重视您的个人信息保护。本政策说明我们如何收集、使用、保护和分享您的信息，适用于您使用 Biru Coffee 的在线服务与相关功能。",
    tocTitle: "本页目录",
    sections: [
      {
        id: "s1",
        heading: "1. 收集的信息",
        paragraphs: ["我们可能根据您的使用场景收集以下信息："],
        bullets: [
          "账号信息：姓名、邮箱、电话等您提供的注册/联系信息。",
          "交易信息：订单内容、取餐信息、退款/取消记录等；支付敏感信息由可信第三方支付处理。",
          "设备与使用记录：例如浏览行为、IP 地址、设备标识、错误/性能记录。",
          "偏好与互动：营销偏好、客服对话或反馈内容（如您主动提供）。",
        ],
      },
      {
        id: "s2",
        heading: "2. 使用目的",
        paragraphs: ["我们可能基于以下目的使用您的信息："],
        bullets: [
          "提供与履行订单，处理取消/退款与对账。",
          "身份验证、账号管理与防止未授权访问。",
          "客服支持、问题排查与服务通知。",
          "改进产品与体验（例如统计分析、功能优化）。",
          "营销沟通（在需要同意时取得同意后发送）。",
          "服务安全与反欺诈，以及遵守法律义务。",
        ],
      },
      {
        id: "s3",
        heading: "3. 分享对象",
        paragraphs: [
          "我们仅在提供服务所必需的范围内共享信息，并要求合作伙伴采取合理保护措施。",
        ],
        bullets: [
          "支付/金融服务：用于完成支付、退款与风险控制。",
          "云服务与基础设施：用于系统运行、存储、监控与备份。",
          "营销与消息服务：在您同意或法律允许时，用于发送通知或营销信息。",
          "依法披露：因法律、司法或监管要求而披露。",
        ],
      },
      {
        id: "s4",
        heading: "4. 保存与安全",
        paragraphs: [
          "我们采取合理的技术与组织措施保护信息（例如访问控制、加密、审计与监控）。",
          "我们将在实现目的所需期间或法定保存期内保存信息，期满后删除或匿名化。也请妥善保管您的登录信息与设备安全。",
        ],
      },
      {
        id: "s5",
        heading: "5. 您的权利",
        paragraphs: ["在适用法律下，您可能享有以下权利："],
        bullets: [
          "查询、访问、复制您的个人信息。",
          "补充或更正。",
          "删除或停止处理（在法律允许范围内）。",
          "撤回同意（不影响撤回前处理的合法性）。",
        ],
      },
      {
        id: "s6",
        heading: "6. 营销与 Cookie",
        paragraphs: [
          "我们可能使用 Cookie 或类似技术维持登录状态、改进体验并分析使用情况。",
          "您可通过浏览器或设备设置管理 Cookie 偏好；部分功能可能受影响。个性化营销将在取得同意后进行（如适用）。",
        ],
      },
      {
        id: "s7",
        heading: "7. 跨境传输",
        paragraphs: [
          "您的信息可能被传输并存储在我们或服务供应商所在地区的服务器上。我们将采用适当保护机制并遵循当地法律要求。",
        ],
      },
      {
        id: "s8",
        heading: "8. 政策更新",
        paragraphs: [
          "我们可能不时更新本政策并在本页面公布；重大变更将另行通知（如法律要求）。继续使用服务即视为接受更新后的内容。",
        ],
      },
    ],
    contact:
      "如对本政策有任何疑问或权利行使需求，请通过客服邮箱或门店与我们联系。",
  },
  [LocaleEnum.En]: {
    title: "Biru Coffee Privacy Policy",
    lastUpdated: "Last updated: 2024/09/01",
    intro:
      "We value your privacy. This policy explains how we collect, use, protect, and share your information when you use Biru Coffee’s online services and related features.",
    tocTitle: "On this page",
    sections: [
      {
        id: "s1",
        heading: "1. Information we collect",
        paragraphs: ["Depending on how you use the Service, we may collect:"],
        bullets: [
          "Account data: name, email, phone number, and other registration/contact details you provide.",
          "Transaction data: order details, pickup info, and cancellation/refund records. Sensitive payment data is handled by trusted third-party payment providers.",
          "Device and usage data: browsing activity, IP address, device identifiers, and error/performance logs.",
          "Preferences and interactions: marketing preferences and customer support conversations you share with us.",
        ],
      },
      {
        id: "s2",
        heading: "2. How we use information",
        paragraphs: ["We may use your information to:"],
        bullets: [
          "Provide and fulfill orders, including cancellations, refunds, and reconciliation.",
          "Authenticate users, manage accounts, and prevent unauthorized access.",
          "Provide customer support and service communications.",
          "Improve products and user experience through analytics and optimization.",
          "Send marketing communications where consent is required and obtained.",
          "Maintain security, prevent fraud, and comply with legal obligations.",
        ],
      },
      {
        id: "s3",
        heading: "3. Sharing of information",
        paragraphs: [
          "We only share information as necessary to operate the Service, and we require reasonable safeguards from our partners.",
        ],
        bullets: [
          "Payment providers for payment processing, refunds, and risk controls.",
          "Cloud and infrastructure providers for hosting, storage, monitoring, and backups.",
          "Marketing and messaging providers where permitted and/or with your consent.",
          "Legal disclosures when required by law, regulation, or valid legal process.",
        ],
      },
      {
        id: "s4",
        heading: "4. Retention and security",
        paragraphs: [
          "We apply reasonable technical and organizational measures to protect information (such as access controls, encryption, and monitoring).",
          "We retain information for as long as needed for the purposes described above or as required by law, then delete or anonymize it. Please also safeguard your credentials and devices.",
        ],
      },
      {
        id: "s5",
        heading: "5. Your rights and choices",
        paragraphs: ["Subject to applicable law, you may:"],
        bullets: [
          "Request access to and a copy of your information.",
          "Request correction or updates.",
          "Request deletion or restriction/objection where applicable.",
          "Withdraw consent where processing is based on consent (this does not affect prior processing).",
        ],
      },
      {
        id: "s6",
        heading: "6. Marketing and cookies",
        paragraphs: [
          "We may use cookies or similar technologies to keep you signed in, improve experience, and analyze usage.",
          "You can manage cookie preferences via your browser/device settings; some features may be affected. Where applicable, personalized marketing is provided only with consent.",
        ],
      },
      {
        id: "s7",
        heading: "7. Cross-border transfers",
        paragraphs: [
          "Your information may be transferred to and stored on servers where we or our providers operate. We use appropriate safeguards and follow applicable local requirements.",
        ],
      },
      {
        id: "s8",
        heading: "8. Updates",
        paragraphs: [
          "We may update this policy and post changes here. Material changes may be notified separately where required by law. Continued use indicates acceptance of the updated policy.",
        ],
      },
    ],
    contact:
      "Questions or requests? Contact us via customer support email or in-store.",
  },
  [LocaleEnum.Ja]: {
    title: "Biru Coffee プライバシーポリシー",
    lastUpdated: "最終更新日：2024/09/01",
    intro:
      "当社はお客様のプライバシーを重視しています。本ポリシーは、Biru Coffee のオンラインサービス利用時における情報の収集、利用、保護、共有について説明します。",
    tocTitle: "目次",
    sections: [
      {
        id: "s1",
        heading: "1. 収集する情報",
        paragraphs: ["利用状況に応じて、以下の情報を収集する場合があります。"],
        bullets: [
          "アカウント情報：氏名、メール、電話など登録/連絡に必要な情報。",
          "取引情報：注文内容、受け取り情報、キャンセル/返金履歴。決済の機微情報は第三者決済事業者が処理します。",
          "端末・利用情報：閲覧履歴、IP、端末識別子、エラー/性能ログ等。",
          "設定・やり取り：マーケティング設定、サポートへのお問い合わせ内容（提供された場合）。",
        ],
      },
      {
        id: "s2",
        heading: "2. 利用目的",
        paragraphs: ["当社は主に以下の目的で情報を利用します。"],
        bullets: [
          "注文提供・履行、キャンセル/返金、取引確認。",
          "認証とアカウント管理、不正アクセス防止。",
          "サポート対応、各種通知、障害調査。",
          "分析・改善による体験向上。",
          "必要な同意取得後のマーケティング配信（該当する場合）。",
          "安全確保、不正防止、法令順守。",
        ],
      },
      {
        id: "s3",
        heading: "3. 共有先",
        paragraphs: [
          "当社はサービス提供に必要な範囲でのみ共有し、委託先にも適切な保護措置を求めます。",
        ],
        bullets: [
          "決済事業者：決済、返金、リスク管理。",
          "クラウド/インフラ：ホスティング、保存、監視、バックアップ。",
          "マーケティング/メッセージング：同意または法令に基づく通知・配信。",
          "法令対応：法令、裁判所、行政機関の要請に基づく開示。",
        ],
      },
      {
        id: "s4",
        heading: "4. 保存と安全管理",
        paragraphs: [
          "アクセス制御、暗号化、監視など合理的な対策により情報を保護します。",
          "目的達成または法定保存期間満了後に削除または匿名化します。ログイン情報はご自身でも適切に管理してください。",
        ],
      },
      {
        id: "s5",
        heading: "5. お客様の権利",
        paragraphs: ["適用法令に基づき、以下を請求できる場合があります。"],
        bullets: [
          "開示（閲覧・写しの交付）。",
          "訂正・更新。",
          "削除、処理の停止、異議申立て（該当する場合）。",
          "同意撤回（撤回前の処理の適法性には影響しません）。",
        ],
      },
      {
        id: "s6",
        heading: "6. マーケティングと Cookie",
        paragraphs: [
          "ログイン維持、体験向上、分析のために Cookie 等を使用する場合があります。",
          "ブラウザ/端末設定で管理できますが、一部機能が利用できない場合があります。個別マーケティングは同意に基づき実施します（該当する場合）。",
        ],
      },
      {
        id: "s7",
        heading: "7. 国外移転",
        paragraphs: [
          "情報は当社または委託先の所在する国のサーバーに移転・保存されることがあります。適切な保護措置の下、各国法令に従います。",
        ],
      },
      {
        id: "s8",
        heading: "8. ポリシーの改定",
        paragraphs: [
          "本ポリシーは随時更新され、本ページで告知します。法令で求められる場合、重要な変更は別途通知します。継続利用により改定に同意したものとみなされます。",
        ],
      },
    ],
    contact:
      "プライバシーに関するお問い合わせや権利行使のご希望は、カスタマーサポートまたは店舗までご連絡ください。",
  },
  [LocaleEnum.Ko]: {
    title: "Biru Coffee 개인정보 처리방침",
    lastUpdated: "최종 업데이트: 2024/09/01",
    intro:
      "당사는 고객의 개인정보 보호를 중시합니다. 본 방침은 Biru Coffee 온라인 서비스를 이용할 때 정보의 수집, 이용, 보호, 공유 방법을 설명합니다.",
    tocTitle: "목차",
    sections: [
      {
        id: "s1",
        heading: "1. 수집하는 정보",
        paragraphs: ["이용 상황에 따라 다음 정보를 수집할 수 있습니다."],
        bullets: [
          "계정 정보: 이름, 이메일, 전화번호 등 등록/연락 정보.",
          "거래 정보: 주문 내용, 픽업 정보, 취소/환불 기록. 결제 관련 민감 정보는 신뢰할 수 있는 결제 대행사가 처리합니다.",
          "기기 및 이용 기록: 브라우징 활동, IP, 기기 식별자, 오류/성능 로그 등.",
          "선호 및 상호작용: 마케팅 선호도, 고객지원 문의 내용(제공 시).",
        ],
      },
      {
        id: "s2",
        heading: "2. 이용 목적",
        paragraphs: ["당사는 주로 다음 목적을 위해 정보를 이용합니다."],
        bullets: [
          "주문 제공 및 이행, 취소/환불 및 거래 확인.",
          "인증과 계정 관리, 무단 접근 방지.",
          "고객 지원, 안내 및 장애 대응.",
          "분석 및 개선을 통한 경험 향상.",
          "필요 시 동의 기반 마케팅 발송(해당 시).",
          "서비스 보안, 사기 방지 및 법적 의무 이행.",
        ],
      },
      {
        id: "s3",
        heading: "3. 공유 대상",
        paragraphs: [
          "서비스 제공에 필요한 범위 내에서만 공유하며, 위탁사에도 합리적인 보호 조치를 요구합니다.",
        ],
        bullets: [
          "결제/금융 서비스: 결제 처리, 환불, 위험 관리.",
          "클라우드/인프라: 호스팅, 저장, 모니터링, 백업.",
          "마케팅/메시징: 동의 또는 법령에 따라 알림·마케팅 발송.",
          "법적 요구: 법령, 수사, 규제기관 요청에 따른 공개.",
        ],
      },
      {
        id: "s4",
        heading: "4. 보관 및 보안",
        paragraphs: [
          "접근 통제, 암호화, 모니터링 등 합리적인 기술·조직적 조치를 통해 정보를 보호합니다.",
          "목적 달성 또는 법정 보관 기간 만료 시 삭제 또는 익명화합니다. 로그인 정보는 고객님께서도 안전하게 관리해 주세요.",
        ],
      },
      {
        id: "s5",
        heading: "5. 이용자의 권리",
        paragraphs: ["적용 법령에 따라 다음 권리를 행사할 수 있습니다."],
        bullets: [
          "열람/사본 제공 요청.",
          "정정/업데이트 요청.",
          "삭제, 처리 제한, 이의 제기(해당 시).",
          "동의 철회(철회 전 처리의 적법성에는 영향 없음).",
        ],
      },
      {
        id: "s6",
        heading: "6. 마케팅 및 쿠키",
        paragraphs: [
          "로그인 유지, 경험 개선 및 분석을 위해 쿠키 등을 사용할 수 있습니다.",
          "브라우저/기기 설정에서 관리할 수 있으나 일부 기능이 제한될 수 있습니다. 개인화 마케팅은 동의하신 경우에만 진행합니다(해당 시).",
        ],
      },
      {
        id: "s7",
        heading: "7. 국외 이전",
        paragraphs: [
          "정보는 당사 또는 위탁사가 위치한 국가의 서버로 이전·저장될 수 있습니다. 적절한 보호 조치 하에 현지 법령을 준수합니다.",
        ],
      },
      {
        id: "s8",
        heading: "8. 정책 변경",
        paragraphs: [
          "본 방침은 수시로 업데이트되며 본 페이지에 게시됩니다. 법령상 요구되는 경우 중요한 변경은 별도로 안내합니다. 서비스 지속 이용 시 변경에 동의한 것으로 봅니다.",
        ],
      },
    ],
    contact:
      "개인정보 관련 문의 또는 권리 행사는 고객지원 이메일 또는 매장을 통해 연락해 주세요.",
  },
};

interface CompanyLegalPrivacyProps {
  locale: Locale;
}

const CompanyLegalPrivacy = ({ locale }: CompanyLegalPrivacyProps) => {
  const content =
    privacyByLocale[locale] || privacyByLocale[routing.defaultLocale];

  return (
    <Box component="section" display="flex" flexDirection="column" gap={2}>
      <Typography
        color="text.primary"
        component="h1"
        fontWeight="bold"
        variant="h4"
      >
        {content.title}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {content.lastUpdated}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {content.intro}
      </Typography>
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={1}>
          <Typography fontWeight="bold" variant="subtitle2">
            {content.tocTitle}
          </Typography>
          <Stack spacing={0.5}>
            {content.sections.map((section) => (
              <MuiLink
                color="text.secondary"
                href={`#${section.id}`}
                key={section.id}
                underline="hover"
                variant="body2"
              >
                {section.heading}
              </MuiLink>
            ))}
          </Stack>
        </Stack>
      </Paper>
      <Stack divider={<Divider />} spacing={3}>
        {content.sections.map((section) => (
          <Stack key={section.id} spacing={1}>
            <Typography
              color="primary"
              component="h2"
              fontWeight="bold"
              id={section.id}
              sx={{ scrollMarginTop: 24 }}
              variant="h6"
            >
              {section.heading}
            </Typography>
            {section.paragraphs.map((p) => (
              <Typography color="text.secondary" key={p} variant="body2">
                {p}
              </Typography>
            ))}
            {section.bullets?.length ? (
              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 2.5,
                  typography: "body2",
                  color: "text.secondary",
                  "& li": { mt: 0.75 },
                }}
              >
                {section.bullets.map((item) => (
                  <Box component="li" key={item}>
                    {item}
                  </Box>
                ))}
              </Box>
            ) : null}
          </Stack>
        ))}
      </Stack>
      <Typography color="text.secondary" variant="body2">
        {content.contact}
      </Typography>
    </Box>
  );
};

export default CompanyLegalPrivacy;
