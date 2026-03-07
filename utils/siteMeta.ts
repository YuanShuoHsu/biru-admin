export const getSiteMeta = () => {
  const siteUrl = process.env.NEXT_PUBLIC_NEXT_URL || "http://localhost:3000";
  const hostname = new URL(siteUrl).hostname.toLowerCase();
  const isStage = hostname.startsWith("stage");
  const isAdmin = hostname.startsWith("admin");
  const isApi = hostname.startsWith("api");
  const isBlockedHost = isStage || isAdmin || isApi;

  return { isBlockedHost, siteUrl };
};
