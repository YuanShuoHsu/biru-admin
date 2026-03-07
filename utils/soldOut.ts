export const getTypographyVariant = (
  message: string,
): "h3" | "h4" | "h5" | "h6" | "body1" | "body2" => {
  const length = message.length;

  if (length <= 6) return "h3";
  if (length <= 12) return "h4";
  if (length <= 20) return "h5";
  if (length <= 30) return "h6";
  if (length <= 50) return "body1";

  return "body2";
};
