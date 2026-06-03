export type ComparisonResult = {
  eq: { [key: string]: [[number, number], [number, number]] };
  diff: { [key: string]: [[number, number], [number, number]] };
  same_sku: { [sku: string]: Array<[number, number, number]> };
  raw: any;
};

export type ProductData = {
  name: string;
  quantity: number;
  weight: number;
};
