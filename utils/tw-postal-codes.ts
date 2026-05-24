import { postalCodes } from "@/constants/tw-postal-codes";

interface AddressEntry {
  region: string;
  locality: string;
}

const postalToAddress = new Map<string, AddressEntry[]>();
const addressToPostal = new Map<string, string>();

for (const { postal, region, locality } of postalCodes) {
  const entry = postalToAddress.get(postal) || [];

  entry.push({ region, locality });
  postalToAddress.set(postal, entry);
  addressToPostal.set(`${region}|${locality}`, postal);
}

export const getAddress = (
  code: string,
): { region: string; locality: string } | null => {
  const districts = postalToAddress.get(code.slice(0, 3));
  if (!districts?.length) return null;

  return districts.length === 1
    ? districts[0]
    : { region: districts[0].region, locality: "" };
};

const normalize = (s: string) => s.trim().replace(/台/g, "臺");

export const getPostalCode = (region: string, locality: string) =>
  addressToPostal.get(`${normalize(region)}|${normalize(locality)}`);
