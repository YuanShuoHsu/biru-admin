// Pionex 分享頁把 KOL 的邀請碼帶在這些參數上：跟單連結用 referral、邀請連結用 r 或 inviteCode
const SHARE_CODE_PARAMS = ["referral", "inviteCode", "r", "shareCode"];
const REFERRAL_PATH = /\/ref\/([^/?#]+)/;

export type ShareCodeInput =
  | { code: string; kind: "code" }
  | { code: string; kind: "link" }
  | { kind: "linkWithoutCode" };

/** 使用者可能貼邀請碼本身，也可能貼整個分享連結 */
export const parseShareCodeInput = (input: string): ShareCodeInput | null => {
  const value = input.trim();
  if (!value) return null;

  const looksLikeLink = /^https?:\/\//i.test(value) || /pionex\./i.test(value);
  if (!looksLikeLink) return { code: value, kind: "code" };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return { kind: "linkWithoutCode" };
  }

  for (const param of SHARE_CODE_PARAMS) {
    const code = url.searchParams.get(param)?.trim();
    if (code) return { code, kind: "link" };
  }
  const referral = url.pathname.match(REFERRAL_PATH)?.[1];

  return referral
    ? { code: decodeURIComponent(referral), kind: "link" }
    : { kind: "linkWithoutCode" };
};

export interface RecentKol {
  avatar?: string;
  code: string;
  nickname: string;
}

const RECENT_KOLS_KEY = "quant.recentKols";
const RECENT_KOLS_EVENT = "quant-recent-kols-change";
const RECENT_KOLS_LIMIT = 6;
const EMPTY: RecentKol[] = [];

let cachedRaw: string | null = null;
let cachedList: RecentKol[] = EMPTY;

export const readRecentKols = (): RecentKol[] => {
  try {
    const raw = localStorage.getItem(RECENT_KOLS_KEY);
    // useSyncExternalStore 要求同一份資料回傳同一個參照
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedList = raw ? (JSON.parse(raw) as RecentKol[]) : EMPTY;
    }

    return cachedList;
  } catch {
    return EMPTY;
  }
};

export const serverRecentKols = () => EMPTY;

export const subscribeRecentKols = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(RECENT_KOLS_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(RECENT_KOLS_EVENT, onChange);
  };
};

const writeRecentKols = (list: RecentKol[]) => {
  try {
    localStorage.setItem(RECENT_KOLS_KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event(RECENT_KOLS_EVENT));
};

export const rememberKol = (kol: RecentKol) => {
  const current = readRecentKols();
  const existing = current.find(({ code }) => code === kol.code);
  if (
    existing?.nickname === kol.nickname &&
    existing.avatar === kol.avatar &&
    current[0]?.code === kol.code
  )
    return;

  writeRecentKols(
    [kol, ...current.filter(({ code }) => code !== kol.code)].slice(
      0,
      RECENT_KOLS_LIMIT,
    ),
  );
};

export const forgetKol = (code: string) =>
  writeRecentKols(readRecentKols().filter((kol) => kol.code !== code));
