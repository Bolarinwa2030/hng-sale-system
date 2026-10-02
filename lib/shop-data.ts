export type ShopProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  badge?: string;
  inStock: boolean;
  stockLabel: string;
  image: string;
  shortDescription: string;
  description: string;
  specs: Array<{ label: string; value: string }>;
};

export const categories = [
  { name: "Rice & Grains", slug: "rice-and-grains" },
  { name: "Kitchen Staples", slug: "kitchen-staples" },
  { name: "Spices & Seasonings", slug: "spices-and-seasonings" },
  { name: "Household Care", slug: "household-care" },
  { name: "Beverages", slug: "beverages" },
  { name: "Fresh Produce", slug: "fresh-produce" },
];
