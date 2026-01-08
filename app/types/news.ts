export type NewsCategory = 'announcement' | 'protocol' | 'notification'
export type NewsStatus = 'draft' | 'published' | 'archived'

export interface News {
  id: number
  title: string
  summary: string | null
  content: string
  category: NewsCategory
  status: NewsStatus
  publishedAt: string
  expiresAt: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface NewsAttachment {
  id: number
  fileName: string
  filePath: string
  fileSize: number | null
  mimeType: string | null
  sortOrder: number
}

export interface NewsDetail extends News {
  attachments: NewsAttachment[]
}
