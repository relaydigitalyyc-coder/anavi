export const buyerIntent = {
  intentType: "buy" as const,
  title: "Seeking Real Estate Investment",
  description: "Looking for commercial real estate in North America",
  assetType: "real_estate" as const,
  keywords: ["real_estate", "commercial", "north_america"],
};

export const sellerIntent = {
  intentType: "sell" as const,
  title: "Commercial Office Building for Sale",
  description: "Prime office building in downtown, 50k sqft",
  assetType: "real_estate" as const,
  keywords: ["real_estate", "commercial", "office"],
};
