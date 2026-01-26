export interface FaqItem {
  id: number
  question: string
  answer: string
  category: string | null
  sortOrder: number
}
