// https://mui.com/store/terms/
// https://vercel.com/legal/terms

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

interface TermsSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

interface TermsContent {
  title: string;
  lastUpdated: string;
  intro: string;
  tocTitle: string;
  sections: TermsSection[];
  contact: string;
}

const termsByLocale: Record<Locale, TermsContent> = {
  [LocaleEnum.ZhTW]: {
    title: "Biru Coffee 會員服務條款",
    lastUpdated: "最近更新：2024/09/01",
    intro:
      "本條款（「本條款」）適用於您使用 Biru Coffee 的網站、行動裝置介面與相關服務（合稱「本服務」）。當您建立帳號、登入、下單或以其他方式使用本服務，即表示您已閱讀、理解並同意受本條款拘束。",
    tocTitle: "本頁目錄",
    sections: [
      {
        id: "definitions",
        heading: "1. 名詞定義",
        paragraphs: ["為便於理解，本條款中使用下列名詞時，具有以下含義："],
        bullets: [
          "「我們」：指 Biru Coffee 及其關係企業、受託服務供應商（在提供本服務所需範圍內）。",
          "「您」：指使用本服務的任何自然人或其合法代理人。",
          "「會員帳號」：指您註冊並用於登入、下單、管理資料之帳戶。",
          "「內容」：指本服務上的文字、圖片、標誌、介面、程式、資料及其他素材。",
        ],
      },
      {
        id: "eligibility-account",
        heading: "2. 資格與帳號",
        paragraphs: [
          "您應具備依適用法律使用本服務之完全行為能力，或已取得法定代理人同意。",
          "您同意提供真實、正確、完整且最新的資訊，並妥善保管登入憑證。若您的帳號發生未經授權使用，請盡速通知我們。",
          "我們得基於安全、違規、技術或法律原因，限制、暫停或終止您的帳號或本服務的全部或部分功能。",
        ],
      },
      {
        id: "orders-payments",
        heading: "3. 訂單、付款與退款",
        paragraphs: [
          "本服務可能提供外帶、自取、內用或其他訂購方式，實際可用功能依門市與系統顯示為準。",
          "您下單後我們可能透過系統或門市確認；如遇商品售罄、設備異常、疑似不實或風險交易等情形，我們得取消或拒絕接受訂單。",
          "價格、品項、加價選項、稅費與服務費（若適用）以結帳頁面顯示為準；我們可能不定期調整。",
          "付款可能由第三方金流處理。您同意遵守該第三方之條款與規範；我們不保存或處理您的完整卡號等敏感支付資訊。",
          "退款、取消與改單規則可能因訂購型態與製作狀態而不同。若法律或門市政策允許退款，我們將依原付款方式或合理方式處理。",
        ],
      },
      {
        id: "pickup-dinein",
        heading: "4. 取餐、到店與異常狀況",
        paragraphs: [
          "取餐時間為預估，可能因尖峰時段、交通、天候或門市狀況而變動。",
          "為確保食品品質，請於門市通知或系統顯示之合理時間內取餐；逾時可能影響口感或造成無法供應。",
          "如您提供之取餐資訊不完整或無法聯繫，可能導致延誤或無法交付；因此產生的損失，除法律另有規定外，將由您承擔。",
        ],
      },
      {
        id: "promotions",
        heading: "5. 優惠、點數與活動",
        paragraphs: [
          "我們可能提供折扣碼、點數、贈品或其他促銷活動。各活動之適用範圍、期限、數量限制與使用條件，以活動頁面或結帳頁面說明為準。",
          "除非另有明示，優惠不得兌換現金、不得轉讓或合併使用；若發現濫用或違規情形，我們得取消優惠資格或追回不當得利。",
        ],
      },
      {
        id: "acceptable-use",
        heading: "6. 合理使用與禁止行為",
        paragraphs: ["您同意不進行以下行為："],
        bullets: [
          "以任何方式干擾、破壞或過度負載本服務（例如：爬蟲、暴力嘗試登入、散佈惡意程式）。",
          "冒用他人身份、提供不實資訊、或協助他人違反本條款。",
          "進行非法、侵權、詐欺、騷擾、仇恨或其他不當行為。",
          "未經授權存取、蒐集或使用本服務或其他使用者資料。",
        ],
      },
      {
        id: "ip",
        heading: "7. 智慧財產權",
        paragraphs: [
          "本服務與其內容之智慧財產權（包括但不限於著作權、商標、營業秘密）屬我們或授權人所有。",
          "我們授予您一個可撤回、不可轉讓、非專屬且僅供個人使用之有限授權，以使用本服務。除本條款明示允許外，您不得重製、改作、散布、公開傳輸或以其他方式利用本服務內容。",
        ],
      },
      {
        id: "third-party",
        heading: "8. 第三方服務與連結",
        paragraphs: [
          "本服務可能包含第三方服務（如金流、分析、地圖）或外部連結。第三方服務之內容與作法由其自行負責，並受其條款與政策約束。",
        ],
      },
      {
        id: "disclaimer-liability",
        heading: "9. 免責聲明與責任限制",
        paragraphs: [
          "本服務依「現況」提供。我們不保證本服務不間斷、完全無誤或符合您特定需求。",
          "在法律允許的最大範圍內，對於任何間接、附帶、特殊、衍生或懲罰性損害（包括但不限於營業損失、資料遺失）我們不負責；對於直接損害之賠償責任，以相關交易中您已實際支付之金額為上限（除非法律另有強制規定）。",
        ],
      },
      {
        id: "changes-termination",
        heading: "10. 變更、終止與其他",
        paragraphs: [
          "我們可能基於營運、法規或安全需要更新本條款並於本頁公告。若您於條款更新後持續使用本服務，即視為同意更新內容。",
          "若本條款任何部分被認定無效，不影響其餘部分之效力。",
          "本條款之準據法為中華民國（台灣）法律。因本服務所生爭議，雙方同意以台灣台北地方法院為第一審管轄法院（法律另有強制規定者除外）。",
        ],
      },
    ],
    contact: "如對本條款有任何疑問，請透過客服信箱或門市與我們聯繫。",
  },
  [LocaleEnum.ZhCN]: {
    title: "Biru Coffee 会员服务条款",
    lastUpdated: "最近更新：2024/09/01",
    intro:
      "本条款（“本条款”）适用于您使用 Biru Coffee 的网站、移动端界面与相关服务（合称“本服务”）。当您注册账号、登录、下单或以其他方式使用本服务，即表示您已阅读、理解并同意受本条款约束。",
    tocTitle: "本页目录",
    sections: [
      {
        id: "definitions",
        heading: "1. 名词定义",
        paragraphs: ["为便于理解，本条款中下列名词具有如下含义："],
        bullets: [
          "“我们”：指 Biru Coffee 及其关联方、受托服务供应商（在提供本服务所需范围内）。",
          "“您”：指使用本服务的任何自然人或其合法代理人。",
          "“会员账号”：指您注册并用于登录、下单、管理信息的账户。",
          "“内容”：指本服务上的文字、图片、标识、界面、程序、数据及其他素材。",
        ],
      },
      {
        id: "eligibility-account",
        heading: "2. 资格与账号",
        paragraphs: [
          "您应具备依适用法律使用本服务的完全民事行为能力，或已取得监护人/法定代理人同意。",
          "您同意提供真实、准确、完整且最新的信息，并妥善保管登录凭证。如发现账号被未授权使用，请尽快通知我们。",
          "我们可基于安全、违规、技术或法律原因，限制、暂停或终止您的账号或本服务的全部或部分功能。",
        ],
      },
      {
        id: "orders-payments",
        heading: "3. 订单、支付与退款",
        paragraphs: [
          "本服务可能提供外带、自取、堂食或其他订购方式，实际可用功能以门店与系统展示为准。",
          "您下单后我们可能通过系统或门店确认；如遇售罄、设备异常、疑似风险交易等情况，我们可取消或拒绝接受订单。",
          "价格、品项、加价选项、税费与服务费（如适用）以结算页显示为准；我们可能不定期调整。",
          "支付可能由第三方支付机构处理。您同意遵守该第三方的条款与规范；我们不保存或处理您的完整卡号等敏感支付信息。",
          "退款、取消与改单规则可能因订购类型与制作状态而不同。若法律或门店政策允许退款，我们将按原支付方式或合理方式处理。",
        ],
      },
      {
        id: "pickup-dinein",
        heading: "4. 取餐、到店与异常情况",
        paragraphs: [
          "取餐时间为预估，可能因高峰期、交通、天气或门店状况而变化。",
          "为确保食品品质，请在门店通知或系统显示的合理时间内取餐；逾时可能影响口感或导致无法供应。",
          "如您提供的取餐信息不完整或无法联系，可能导致延误或无法交付；除法律另有规定外，由此产生的损失由您承担。",
        ],
      },
      {
        id: "promotions",
        heading: "5. 优惠、积分与活动",
        paragraphs: [
          "我们可能提供优惠码、积分、赠品或其他促销活动。适用范围、期限、数量限制与使用条件以活动页或结算页说明为准。",
          "除非另有明示，优惠不可兑换现金、不可转让或合并使用；如发现滥用或违规，我们可取消资格或追回不当得利。",
        ],
      },
      {
        id: "acceptable-use",
        heading: "6. 合理使用与禁止行为",
        paragraphs: ["您同意不进行以下行为："],
        bullets: [
          "以任何方式干扰、破坏或过度负载本服务（例如爬虫、暴力尝试登录、传播恶意程序）。",
          "冒用他人身份、提供虚假信息，或协助他人违反本条款。",
          "进行违法、侵权、欺诈、骚扰、仇恨或其他不当行为。",
          "未经授权访问、收集或使用本服务或其他用户信息。",
        ],
      },
      {
        id: "ip",
        heading: "7. 知识产权",
        paragraphs: [
          "本服务及其内容的知识产权（包括但不限于著作权、商标、商业秘密）归我们或授权方所有。",
          "我们授予您可撤回、不可转让、非独占且仅供个人使用的有限许可。除本条款明示允许外，您不得复制、改编、传播、公开传输或以其他方式利用本服务内容。",
        ],
      },
      {
        id: "third-party",
        heading: "8. 第三方服务与链接",
        paragraphs: [
          "本服务可能包含第三方服务（如支付、分析、地图）或外部链接。第三方的内容与做法由其自行负责，并受其条款与政策约束。",
        ],
      },
      {
        id: "disclaimer-liability",
        heading: "9. 免责声明与责任限制",
        paragraphs: [
          "本服务按“现状”提供。我们不保证服务不间断、完全无误或满足您的特定需求。",
          "在法律允许的最大范围内，我们不对任何间接、附带、特殊、衍生或惩罚性损失负责（包括但不限于营业损失、数据丢失）；对直接损失的赔偿责任以相关交易中您实际支付的金额为上限（法律另有强制规定的除外）。",
        ],
      },
      {
        id: "changes-termination",
        heading: "10. 变更、终止与其他",
        paragraphs: [
          "我们可能因运营、法规或安全需要更新本条款并在本页公告。若您在更新后继续使用本服务，即视为同意更新内容。",
          "如本条款任何部分被认定无效，不影响其余部分效力。",
          "本条款适用中华民国（台湾）法律。因本服务产生的争议，双方同意以台湾台北地方法院为第一审管辖法院（法律另有强制规定的除外）。",
        ],
      },
    ],
    contact: "如对本条款有任何疑问，请通过客服邮箱或门店与我们联系。",
  },
  [LocaleEnum.En]: {
    title: "Biru Coffee Terms of Service",
    lastUpdated: "Last updated: 2024/09/01",
    intro:
      "These Terms of Service (“Terms”) govern your use of Biru Coffee’s website, mobile interfaces, and related services (collectively, the “Service”). By creating an account, signing in, placing an order, or otherwise using the Service, you agree to be bound by these Terms.",
    tocTitle: "On this page",
    sections: [
      {
        id: "definitions",
        heading: "1. Definitions",
        paragraphs: ["For clarity, the following terms have these meanings:"],
        bullets: [
          "“Biru Coffee”, “we”, “us”, or “our” means Biru Coffee and its affiliates and service providers to the extent necessary to operate the Service.",
          "“you” means any user of the Service.",
          "“Account” means your registered membership account used to access and manage the Service.",
          "“Content” means text, images, logos, interfaces, software, data, and other materials on the Service.",
        ],
      },
      {
        id: "eligibility-account",
        heading: "2. Eligibility and account",
        paragraphs: [
          "You must have the legal capacity to use the Service under applicable law, or have consent from a parent/guardian if required.",
          "You agree to provide accurate, complete, and up-to-date information and to keep your credentials secure. Please notify us promptly if you suspect unauthorized use.",
          "We may restrict, suspend, or terminate your Account or access to the Service for security, policy, technical, or legal reasons.",
        ],
      },
      {
        id: "orders-payments",
        heading: "3. Orders, payments, and refunds",
        paragraphs: [
          "The Service may support pickup, dine-in, or other ordering modes depending on store availability and what is displayed in the checkout flow.",
          "We may confirm orders through the Service or at the store. We may cancel or decline an order due to out-of-stock items, technical issues, or suspected risk/fraud.",
          "Prices, items, options, taxes, and service fees (if any) are shown at checkout and may change from time to time.",
          "Payments may be processed by third-party payment providers. You agree to their terms, and we do not store or process full card numbers or similar sensitive payment data.",
          "Cancellation, changes, and refunds depend on order type and preparation status. Where refunds are permitted by law or store policy, we will process them to the original payment method or another reasonable method.",
        ],
      },
      {
        id: "pickup-dinein",
        heading: "4. Pickup and store experience",
        paragraphs: [
          "Pickup times are estimates and may vary due to peak hours, traffic, weather, or store operations.",
          "To help maintain product quality, please pick up within a reasonable time after notification; delays may affect quality or availability.",
          "If the pickup details you provide are incomplete or we cannot reach you, this may cause delays or failed delivery/pickup. Unless required by law, you are responsible for resulting losses.",
        ],
      },
      {
        id: "promotions",
        heading: "5. Promotions and rewards",
        paragraphs: [
          "We may offer promo codes, rewards, freebies, or campaigns. Eligibility, limits, and conditions are described in the campaign details or at checkout.",
          "Unless explicitly stated, promotions are not cash, not transferable, and may not be combined. We may revoke benefits in cases of abuse or violation.",
        ],
      },
      {
        id: "acceptable-use",
        heading: "6. Acceptable use",
        paragraphs: ["You agree not to:"],
        bullets: [
          "Interfere with or disrupt the Service (e.g., scraping, brute-force login attempts, or malware).",
          "Impersonate others, provide false information, or help others violate these Terms.",
          "Engage in unlawful, infringing, fraudulent, harassing, hateful, or otherwise harmful conduct.",
          "Access, collect, or use data from the Service without authorization.",
        ],
      },
      {
        id: "ip",
        heading: "7. Intellectual property",
        paragraphs: [
          "The Service and Content are owned by us or our licensors and are protected by intellectual property laws.",
          "We grant you a limited, revocable, non-exclusive, non-transferable license to use the Service for personal use only. Except as expressly permitted, you may not copy, modify, distribute, or otherwise exploit the Content.",
        ],
      },
      {
        id: "third-party",
        heading: "8. Third-party services",
        paragraphs: [
          "The Service may rely on third-party services (such as payments, analytics, or maps) or include external links. Those third parties are responsible for their own services and policies.",
        ],
      },
      {
        id: "disclaimer-liability",
        heading: "9. Disclaimers and limitation of liability",
        paragraphs: [
          "The Service is provided “as is”. We do not guarantee uninterrupted or error-free operation or fitness for a particular purpose.",
          "To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages (including loss of profits or data). Our liability for direct damages is limited to the amount you actually paid for the relevant transaction, unless mandatory law provides otherwise.",
        ],
      },
      {
        id: "changes-termination",
        heading: "10. Changes, termination, and misc.",
        paragraphs: [
          "We may update these Terms for operational, legal, or security reasons and post updates on this page. Continued use after updates means you accept the updated Terms.",
          "If any part of these Terms is held invalid, the remainder remains in effect.",
          "These Terms are governed by the laws of Taiwan (R.O.C.). Disputes will be submitted to the Taipei District Court as the court of first instance, unless mandatory law provides otherwise.",
        ],
      },
    ],
    contact:
      "If you have questions about these Terms, please contact us via our customer support email or at our stores.",
  },
  [LocaleEnum.Ja]: {
    title: "Biru Coffee 利用規約",
    lastUpdated: "最終更新日：2024/09/01",
    intro:
      "本利用規約（「本規約」）は、Biru Coffee のウェブサイト、モバイル画面および関連サービス（総称して「本サービス」）の利用に適用されます。アカウント作成、ログイン、注文、その他本サービスを利用することで、本規約に同意したものとみなされます。",
    tocTitle: "目次",
    sections: [
      {
        id: "definitions",
        heading: "1. 用語の定義",
        paragraphs: ["本規約における主な用語は次のとおりです。"],
        bullets: [
          "「当社」：Biru Coffee および本サービス運営に必要な範囲での関係会社・委託先を指します。",
          "「お客様」：本サービスを利用する方を指します。",
          "「アカウント」：ログインや注文、情報管理に使用する会員アカウントを指します。",
          "「コンテンツ」：本サービス上の文章、画像、ロゴ、UI、ソフトウェア、データ等を指します。",
        ],
      },
      {
        id: "eligibility-account",
        heading: "2. 利用資格とアカウント",
        paragraphs: [
          "適用法令により本サービスを利用できる能力を有すること、または必要に応じて保護者等の同意を得ていることが必要です。",
          "正確かつ最新の情報を提供し、認証情報を適切に管理してください。不正利用の疑いがある場合は速やかにご連絡ください。",
          "当社は安全確保、規約違反、技術上または法的理由により、アカウントや本サービスの利用を制限・停止・終了することがあります。",
        ],
      },
      {
        id: "orders-payments",
        heading: "3. 注文・決済・返金",
        paragraphs: [
          "本サービスは、店舗状況や画面表示に応じて、テイクアウト、自取、店内利用等の注文形態を提供する場合があります。",
          "在庫切れ、システム不具合、リスク取引の疑い等がある場合、当社は注文を取消し、または受領を拒否することがあります。",
          "価格、商品、オプション、税金および手数料（該当する場合）は決済画面の表示が優先され、予告なく変更されることがあります。",
          "決済は第三者決済事業者により処理される場合があります。お客様は当該事業者の規約に同意し、当社はカード番号等の機微情報を保存・処理しません。",
          "キャンセル、変更、返金の可否は注文形態や調理状況により異なります。法令または店舗方針に基づき返金可能な場合、原決済手段等の合理的な方法で処理します。",
        ],
      },
      {
        id: "pickup-dinein",
        heading: "4. 受け取り・来店・不測の事態",
        paragraphs: [
          "受け取り時刻は目安であり、混雑、天候、店舗状況等により変動する場合があります。",
          "品質維持のため、通知後は合理的な時間内にお受け取りください。遅延により品質が低下する場合があります。",
          "受け取り情報が不十分、または連絡不能の場合、遅延・提供不可となることがあります。法令で認められる範囲で、その結果はお客様の負担となります。",
        ],
      },
      {
        id: "promotions",
        heading: "5. クーポン・特典・キャンペーン",
        paragraphs: [
          "クーポン、ポイント、景品等のキャンペーンを実施する場合があります。条件、期限、上限等は各案内または決済画面に従います。",
          "特段の記載がない限り、特典は現金化・譲渡不可で、併用できない場合があります。不正利用が疑われる場合、当社は特典の取消し等を行えます。",
        ],
      },
      {
        id: "acceptable-use",
        heading: "6. 禁止事項",
        paragraphs: ["お客様は以下の行為をしないものとします。"],
        bullets: [
          "スクレイピングや不正アクセス等により本サービスを妨害・過負荷にする行為。",
          "なりすまし、虚偽情報の提供、または第三者による違反の助長。",
          "違法、侵害、詐欺、嫌がらせ、その他不適切な行為。",
          "権限なく本サービスまたは他の利用者の情報へアクセス・収集・利用する行為。",
        ],
      },
      {
        id: "ip",
        heading: "7. 知的財産権",
        paragraphs: [
          "本サービスおよびコンテンツに関する知的財産権は当社またはライセンサーに帰属します。",
          "当社は、個人利用に限り、撤回可能・非独占・譲渡不可の限定的利用許諾を付与します。明示的に許可されない限り、複製、改変、配布等はできません。",
        ],
      },
      {
        id: "third-party",
        heading: "8. 第三者サービス",
        paragraphs: [
          "本サービスは第三者サービス（決済、分析、地図等）を利用する場合があります。第三者のサービス内容は各社の規約・方針に従います。",
        ],
      },
      {
        id: "disclaimer-liability",
        heading: "9. 免責および責任制限",
        paragraphs: [
          "本サービスは現状有姿で提供されます。当社は中断や不具合がないこと等を保証しません。",
          "法令で許される最大限の範囲で、間接損害・特別損害等について当社は責任を負いません。当社の直接損害に対する責任は、当該取引でお客様が実際に支払った金額を上限とします（強行法規がある場合を除きます）。",
        ],
      },
      {
        id: "changes-termination",
        heading: "10. 改定・終了・その他",
        paragraphs: [
          "当社は運営上・法令上・安全上の必要に応じて本規約を変更し、本ページに掲載します。変更後の利用継続により、変更に同意したものとみなされます。",
          "本規約の一部が無効となっても、残りは有効に存続します。",
          "本規約は台湾（中華民国）法に準拠し、紛争は台北地方法院を第一審の専属的合意管轄裁判所とします（強行法規がある場合を除きます）。",
        ],
      },
    ],
    contact:
      "本規約に関するお問い合わせは、サポート窓口または店舗までご連絡ください。",
  },
  [LocaleEnum.Ko]: {
    title: "Biru Coffee 서비스 이용약관",
    lastUpdated: "최종 업데이트: 2024/09/01",
    intro:
      "본 이용약관(“본 약관”)은 Biru Coffee 웹사이트, 모바일 인터페이스 및 관련 서비스(총칭 “본 서비스”) 이용에 적용됩니다. 계정 생성, 로그인, 주문 또는 기타 방식으로 본 서비스를 이용하는 경우 본 약관에 동의한 것으로 간주됩니다.",
    tocTitle: "목차",
    sections: [
      {
        id: "definitions",
        heading: "1. 용어 정의",
        paragraphs: ["본 약관에서 사용되는 주요 용어는 다음과 같습니다."],
        bullets: [
          "“당사” 또는 “Biru Coffee”: 본 서비스를 운영하는 Biru Coffee 및 필요한 범위의 관계사/위탁사를 의미합니다.",
          "“이용자”: 본 서비스를 이용하는 자를 의미합니다.",
          "“계정”: 로그인, 주문, 정보 관리를 위해 등록한 회원 계정을 의미합니다.",
          "“콘텐츠”: 본 서비스의 텍스트, 이미지, 로고, UI, 소프트웨어, 데이터 등을 의미합니다.",
        ],
      },
      {
        id: "eligibility-account",
        heading: "2. 이용 자격 및 계정",
        paragraphs: [
          "관련 법령상 본 서비스를 이용할 수 있는 능력이 있어야 하며, 필요한 경우 보호자/법정대리인의 동의를 받아야 합니다.",
          "정확하고 최신의 정보를 제공하고, 로그인 정보를 안전하게 관리해 주세요. 무단 사용이 의심되면 즉시 당사에 알려 주세요.",
          "당사는 보안, 약관 위반, 기술 또는 법적 사유로 계정 또는 본 서비스 접근을 제한·중단·종료할 수 있습니다.",
        ],
      },
      {
        id: "orders-payments",
        heading: "3. 주문·결제·환불",
        paragraphs: [
          "본 서비스는 매장 및 결제 화면 표시 기준으로 픽업, 매장 이용 등 다양한 주문 방식을 제공할 수 있습니다.",
          "품절, 시스템 문제, 위험 거래 의심 등 사유가 있는 경우 당사는 주문을 취소하거나 수락을 거부할 수 있습니다.",
          "가격, 상품, 옵션, 세금 및 수수료(해당 시)는 결제 화면 표시를 기준으로 하며, 수시로 변경될 수 있습니다.",
          "결제는 제3자 결제사가 처리할 수 있습니다. 이용자는 해당 결제사의 약관을 준수하며, 당사는 카드번호 등 민감 결제정보를 저장·처리하지 않습니다.",
          "취소, 변경, 환불 가능 여부는 주문 유형 및 제조 진행 상태에 따라 달라질 수 있습니다. 법령 또는 매장 정책상 허용되는 경우 원 결제수단 또는 합리적인 방식으로 처리됩니다.",
        ],
      },
      {
        id: "pickup-dinein",
        heading: "4. 픽업 및 매장 이용",
        paragraphs: [
          "픽업 시간은 예상치이며, 혼잡 시간대, 교통, 날씨, 매장 운영 상황에 따라 달라질 수 있습니다.",
          "품질 유지를 위해 안내 후 합리적인 시간 내에 픽업해 주세요. 지연 시 품질 저하 또는 제공 불가가 발생할 수 있습니다.",
          "제공하신 픽업 정보가 불완전하거나 연락이 불가한 경우 지연 또는 제공 실패가 발생할 수 있으며, 법령상 달리 요구되지 않는 한 그로 인한 손해는 이용자 부담입니다.",
        ],
      },
      {
        id: "promotions",
        heading: "5. 프로모션 및 혜택",
        paragraphs: [
          "당사는 쿠폰, 리워드, 증정품 등 프로모션을 제공할 수 있습니다. 적용 조건, 기간, 한도 등은 안내 또는 결제 화면을 따릅니다.",
          "별도 명시가 없는 한 현금화·양도 불가이며, 중복 사용이 제한될 수 있습니다. 오남용 또는 위반이 확인되면 혜택을 취소할 수 있습니다.",
        ],
      },
      {
        id: "acceptable-use",
        heading: "6. 금지행위",
        paragraphs: ["이용자는 다음 행위를 하지 않습니다."],
        bullets: [
          "스크래핑, 무차별 로그인 시도, 악성코드 배포 등으로 본 서비스를 방해하거나 과부하를 유발하는 행위.",
          "타인 사칭, 허위 정보 제공, 또는 제3자의 위반을 돕는 행위.",
          "불법, 권리침해, 사기, 괴롭힘, 혐오 등 부적절한 행위.",
          "권한 없이 데이터에 접근·수집·이용하는 행위.",
        ],
      },
      {
        id: "ip",
        heading: "7. 지식재산권",
        paragraphs: [
          "본 서비스와 콘텐츠에 대한 지식재산권은 당사 또는 라이선서에게 귀속됩니다.",
          "당사는 개인 이용 목적에 한해 철회 가능, 비독점, 양도 불가한 제한적 이용권을 부여합니다. 명시적으로 허용되지 않는 한 복제·수정·배포 등은 금지됩니다.",
        ],
      },
      {
        id: "third-party",
        heading: "8. 제3자 서비스",
        paragraphs: [
          "본 서비스는 결제, 분석, 지도 등 제3자 서비스를 사용할 수 있습니다. 제3자 서비스는 각 사의 약관과 정책이 적용됩니다.",
        ],
      },
      {
        id: "disclaimer-liability",
        heading: "9. 면책 및 책임 제한",
        paragraphs: [
          "본 서비스는 “있는 그대로” 제공되며, 중단 없음 또는 무오류를 보장하지 않습니다.",
          "법령이 허용하는 최대 범위에서 당사는 간접·부수·특별·결과적·징벌적 손해에 대해 책임을 지지 않습니다. 직접 손해에 대한 책임은 관련 거래에서 이용자가 실제로 지불한 금액을 한도로 합니다(강행규정이 있는 경우 제외).",
        ],
      },
      {
        id: "changes-termination",
        heading: "10. 변경·종료 및 기타",
        paragraphs: [
          "당사는 운영, 법령, 보안상 필요에 따라 본 약관을 변경하고 본 페이지에 게시할 수 있습니다. 변경 후 계속 이용 시 변경에 동의한 것으로 봅니다.",
          "약관의 일부가 무효가 되더라도 나머지 조항은 유효합니다.",
          "본 약관은 대만(중화민국) 법률을 준거법으로 하며, 분쟁은 타이베이 지방법원을 제1심 관할 법원으로 합니다(강행규정이 있는 경우 제외).",
        ],
      },
    ],
    contact:
      "본 약관에 관한 문의는 고객지원 이메일 또는 매장을 통해 연락해 주세요.",
  },
};

interface CompanyLegalTermsProps {
  locale: Locale;
}

const CompanyLegalTerms = ({ locale }: CompanyLegalTermsProps) => {
  const content = termsByLocale[locale] ?? termsByLocale[routing.defaultLocale];

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
          <Stack spacing={1}>
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

export default CompanyLegalTerms;
