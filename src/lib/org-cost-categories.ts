/**
 * Cost categories are organization master data (Organization → Cost Categories).
 * The project Financials tab reads the same list so every cost item is
 * classified with a category the organization actually maintains.
 */
export type CostCategory = {
  id: string;
  name: string;
  number: string;
  description: string;
  type: "CapEx" | "OpEx";
};

export const DEFAULT_COST_CATEGORIES: CostCategory[] = [
  { id: "staff", name: "Staff", number: "CC-001", description: "Salaries, benefits and internal staff cost", type: "OpEx" },
  { id: "services", name: "Services", number: "CC-002", description: "External professional and managed services", type: "OpEx" },
  { id: "insurance", name: "Insurance", number: "CC-003", description: "Project and asset insurance premiums", type: "OpEx" },
  { id: "business-trips", name: "Business Trips", number: "CC-004", description: "Travel, accommodation and per-diem", type: "OpEx" },
  { id: "contracts", name: "Contracts", number: "CC-005", description: "Capitalized contracts and construction works", type: "CapEx" },
];
