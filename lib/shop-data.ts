export type ShopProduct = {
  id: string;
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

export const products: ShopProduct[] = [
  {
    id: "prod-rice-25kg",
    slug: "mariam-market-rice-25kg",
    name: "Mariam Market Rice 25kg",
    category: "Rice & Grains",
    price: 42000,
    oldPrice: 47000,
    discount: 11,
    rating: 4.8,
    reviews: 312,
    badge: "Top seller",
    inStock: true,
    stockLabel: "In stock",
    image: "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Premium long-grain rice for family meals and everyday cooking.",
    description:
      "A premium rice choice for homes, event catering, and everyday family meals. Clean, fluffy, and rich in texture for the best cooking outcomes.",
    specs: [
      { label: "Pack size", value: "25kg" },
      { label: "Type", value: "Long grain" },
      { label: "Origin", value: "Nigeria" },
      { label: "Storage", value: "Cool dry place" },
    ],
  },
  {
    id: "prod-palm-oil",
    slug: "golden-palm-oil-4l",
    name: "Golden Palm Oil 4L",
    category: "Kitchen Staples",
    price: 18500,
    oldPrice: 21500,
    discount: 14,
    rating: 4.7,
    reviews: 204,
    badge: "Fresh stock",
    inStock: true,
    stockLabel: "Ready to ship",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Cold-pressed, rich palm oil ideal for soups, sauces, and stews.",
    description:
      "A household favorite for preparing traditional dishes, soups, and sauces with a rich golden color and smooth taste.",
    specs: [
      { label: "Volume", value: "4 litres" },
      { label: "Type", value: "Refined" },
      { label: "Use", value: "Cooking" },
      { label: "Packaging", value: "Sealed bottle" },
    ],
  },
  {
    id: "prod-spice-bundle",
    slug: "local-spice-bundle",
    name: "Local Spice Bundle",
    category: "Spices & Seasonings",
    price: 9500,
    oldPrice: 11500,
    discount: 17,
    rating: 4.9,
    reviews: 421,
    badge: "Best value",
    inStock: true,
    stockLabel: "In stock",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    shortDescription: "A balanced mix of essential seasonings for authentic home cooking.",
    description:
      "A carefully blended set of local seasonings chosen for soups, peppers, rice, and stews with a homemade flavor profile.",
    specs: [
      { label: "Contents", value: "6 spice items" },
      { label: "Flavour", value: "Classic local" },
      { label: "Suitability", value: "Home cooking" },
      { label: "Packaging", value: "Gift-ready set" },
    ],
  },
  {
    id: "prod-soap-pack",
    slug: "family-soap-pack",
    name: "Family Soap Pack",
    category: "Household Care",
    price: 6000,
    oldPrice: 7600,
    discount: 21,
    rating: 4.6,
    reviews: 196,
    badge: "Daily essential",
    inStock: true,
    stockLabel: "Low stock",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Everyday hygiene essentials for the whole household.",
    description:
      "Clean, dependable household soap for regular use in the kitchen, bath, and general cleaning routines.",
    specs: [
      { label: "Count", value: "8 bars" },
      { label: "Skin type", value: "All families" },
      { label: "Use", value: "Bath & cleaning" },
      { label: "Finish", value: "Gentle fragrance" },
    ],
  },
  {
    id: "prod-milk-mix",
    slug: "breakfast-milk-mix",
    name: "Breakfast Milk Mix",
    category: "Beverages",
    price: 3200,
    oldPrice: 4200,
    discount: 24,
    rating: 4.5,
    reviews: 143,
    badge: "New arrival",
    inStock: true,
    stockLabel: "In stock",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Creamy breakfast drink mix for busy homes and quick nutrition.",
    description:
      "A quick, nutritious breakfast staple that mixes easily and delivers a smooth, comforting taste in every serving.",
    specs: [
      { label: "Weight", value: "1kg" },
      { label: "Use", value: "Breakfast" },
      { label: "Pack", value: "Resealable" },
      { label: "Taste", value: "Creamy" },
    ],
  },
  {
    id: "prod-yam-flour",
    slug: "yam-flour-family-pack",
    name: "Yam Flour Family Pack",
    category: "Rice & Grains",
    price: 7600,
    oldPrice: 9000,
    discount: 16,
    rating: 4.8,
    reviews: 278,
    inStock: true,
    stockLabel: "Ready to ship",
    image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Smooth, nutritious yam flour for delicious local meals.",
    description:
      "Loved for quick preparation and tender texture, this family pack is ideal for soups and local staples enjoyed at home.",
    specs: [
      { label: "Weight", value: "2kg" },
      { label: "Type", value: "Instant yam flour" },
      { label: "Cooking", value: "Fast prep" },
      { label: "Texture", value: "Smooth" },
    ],
  },
  {
    id: "prod-tomato-mix",
    slug: "tomato-cooking-paste",
    name: "Tomato Cooking Paste",
    category: "Kitchen Staples",
    price: 4200,
    oldPrice: 5200,
    discount: 19,
    rating: 4.7,
    reviews: 188,
    inStock: true,
    stockLabel: "In stock",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Rich, vibrant tomato paste for sauces, stews, and soups.",
    description:
      "A kitchen essential used to add deep flavor and color to recipes without the extra prep work.",
    specs: [
      { label: "Volume", value: "500g" },
      { label: "Flavor", value: "Rich tomato" },
      { label: "Use", value: "Sauces & stew" },
      { label: "Shelf", value: "Long lasting" },
    ],
  },
  {
    id: "prod-plantain-chips",
    slug: "crispy-plantain-chips",
    name: "Crispy Plantain Chips",
    category: "Fresh Produce",
    price: 2800,
    oldPrice: 3500,
    discount: 20,
    rating: 4.4,
    reviews: 102,
    badge: "Snack favorite",
    inStock: false,
    stockLabel: "Out of stock",
    image: "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=900&q=80",
    shortDescription: "Crunchy, savory chips made for quick snacks and sharing.",
    description:
      "A satisfying snack for family moments and quick breaks, made with simple ingredients and authentic taste.",
    specs: [
      { label: "Weight", value: "250g" },
      { label: "Flavor", value: "Lightly salted" },
      { label: "Type", value: "Snack" },
      { label: "Best for", value: "Sharing" },
    ],
  },
];

export const featuredProducts = products.slice(0, 4);

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
