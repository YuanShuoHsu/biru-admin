import type { Locale } from "@/i18n/routing";

interface Ingredient {
  id: string;
  key: string;
  name: Record<Locale, string>;
  createdAt: Date;
  menuItemId?: string;
  menuItemOptionChoiceId?: string;
  unit: Record<Locale, string>;
  updatedAt: Date;
  usage: number;
}

export interface Choice {
  id: string;
  key: string;
  name: Record<Locale, string>;
  createdAt: Date;
  extraCost: number;
  ingredients: Ingredient[];
  isActive: boolean;
  isShared: boolean;
  menuItemOptionId: string;
  sold: number;
  stock: number | null;
  updatedAt: Date;
}

export interface Option {
  id: string;
  key: string;
  name: Record<Locale, string>;
  choices: Choice[];
  createdAt: Date;
  isActive: boolean;
  menuItemId: string;
  multiple: boolean;
  required: boolean;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  key: string;
  name: Record<Locale, string>;
  createdAt: Date;
  description: Record<Locale, string>;
  image: string | null;
  ingredients: Ingredient[];
  isActive: boolean;
  menuId: string;
  options: Option[];
  price: number;
  sold: number;
  stock: number | null;
  updatedAt: Date;
}

export interface Menu {
  id: string;
  key: string;
  name: Record<Locale, string>;
  createdAt: Date;
  isActive: boolean;
  items: MenuItem[];
  storeId: string;
  updatedAt: Date;
}
