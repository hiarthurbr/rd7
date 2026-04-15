export type ComparisonResult = {
  eq: { [key: string]: [[number, number], [number, number]] }
  diff: { [key: string]: [[number, number], [number, number]] }
}

export type ProductData = {
  name: string
  quantity: number
  weight: number
}
