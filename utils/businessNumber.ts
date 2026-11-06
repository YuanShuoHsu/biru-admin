export const BUSINESS_NUMBER_PATTERN = /^\d{8}$/;

// https://www.fia.gov.tw/singlehtml/3?cntId=c4d9cff38c8642ef8872774ee9987283
export const isValidBusinessNumber = (value: string) => {
  if (!BUSINESS_NUMBER_PATTERN.test(value)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const sum = value
    .split("")
    .map((digit, index) => Number(digit) * weights[index])
    .reduce(
      (total, product) => total + Math.floor(product / 10) + (product % 10),
      0,
    );
  return sum % 5 === 0 || (value[6] === "7" && (sum + 1) % 5 === 0);
};
