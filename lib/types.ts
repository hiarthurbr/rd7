export type ComparisonResult = {
  eq: { [key: string]: [[number, number], [number, number]] }
  diff: { [key: string]: [[number, number], [number, number]] }
  same_sku: { [id: string]: [string, number, number]}
}

export type ProductData = {
  name: string
  quantity: number
  weight: number
}
