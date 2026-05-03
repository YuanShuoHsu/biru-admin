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

// https://schema.org/Menu
export interface AdminMenu {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  image: string | null;
  inLanguage: string | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/MenuSection
export interface AdminMenuSection {
  id: string;
  menuId: string | null;
  parentSectionId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/MenuItem
export interface AdminMenuItem {
  id: string;
  menuId: string | null;
  menuSectionId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
  suitableForDiet: RestrictedDiet[] | null;
  nutrition: NutritionInformation | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/Offer
export interface AdminOffer {
  id: string;
  menuItemId: string | null;
  menuSectionId: string | null;
  price: string | null;
  priceCurrency: string | null;
  availability: ItemAvailability | null;
  availabilityStarts: string | null;
  availabilityEnds: string | null;
  priceValidUntil: string | null;
  validFrom: string | null;
  validThrough: string | null;
  sku: string | null;
  eligibleQuantityMin: number | null;
  eligibleQuantityMax: number | null;
  sellerId: string | null;
  eligibleRegion: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// https://schema.org/MenuItem menuAddOn property
export interface AdminMenuItemAddOn {
  id: string;
  menuItemId: string;
  addOnMenuItemId: string | null;
  addOnMenuSectionId: string | null;
  createdAt: string;
  updatedAt: string;
}
