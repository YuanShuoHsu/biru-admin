import type { Locale } from "@/i18n/routing";

// https://schema.org/RestrictedDiet
export type RestrictedDiet =
  | "DiabeticDiet"
  | "GlutenFreeDiet"
  | "HalalDiet"
  | "HinduDiet"
  | "KosherDiet"
  | "LowCalorieDiet"
  | "LowFatDiet"
  | "LowLactoseDiet"
  | "LowSaltDiet"
  | "VeganDiet"
  | "VegetarianDiet";

// https://schema.org/ItemAvailability
export type ItemAvailability =
  | "BackOrder"
  | "Discontinued"
  | "InStock"
  | "InStoreOnly"
  | "LimitedAvailability"
  | "MadeToOrder"
  | "OnlineOnly"
  | "OutOfStock"
  | "PreOrder"
  | "PreSale"
  | "Reserved"
  | "SoldOut";

// https://schema.org/Menu
export interface Menu {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  image: string | null;
  inLanguage: Locale | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/MenuSection
export interface MenuSection {
  id: string;
  menuId: string | null;
  parentSectionId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/NutritionInformation
export interface NutritionInformation {
  calories?: string;
  carbohydrateContent?: string;
  cholesterolContent?: string;
  fatContent?: string;
  fiberContent?: string;
  proteinContent?: string;
  saturatedFatContent?: string;
  servingSize?: string;
  sodiumContent?: string;
  sugarContent?: string;
  transFatContent?: string;
  unsaturatedFatContent?: string;
}

// https://schema.org/MenuItem
export interface MenuItem {
  id: string;
  menuId: string | null;
  menuSectionId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
  suitableForDiet: RestrictedDiet[] | null;
  nutrition: NutritionInformation | null;
  offer: Offer | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/QuantitativeValue
export interface QuantitativeValue {
  // unitCode?: string;
  unitText?: string;
  value?: number;
}

// https://schema.org/PriceSpecification
export interface PriceSpecification {
  price: string;
  priceCurrency: string;
  validFrom?: string;
  validThrough?: string;
}

// https://schema.org/Offer
export interface Offer {
  id: string;
  menuItemId: string | null;
  menuSectionId: string | null;
  price: string | null;
  priceCurrency: string | null;
  availability: ItemAvailability | null;
  deliveryLeadTime: QuantitativeValue | null;
  inventoryLevel: QuantitativeValue | null;
  priceSpecification: PriceSpecification | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/MenuItem menuAddOn property
export interface MenuItemAddOn {
  id: string;
  menuItemId: string;
  addOnMenuItemId: string | null;
  addOnMenuItemName: string | null;
  addOnMenuSectionId: string | null;
  addOnMenuSectionName: string | null;
  addOnMenuItemSectionId: string | null;
  addOnMenuItemSectionName: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
