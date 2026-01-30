import type { Contract, ContractStatus } from '~/types/contract'

interface ContractRow {
  id: number
  contract_number: string
  user_id: string
  status: ContractStatus
  tariff_name: string | null
  monthly_fee: number | null
  connection_address: string | null
  date_created: string
  date_updated: string
}

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseServer(event)

  const sessionUser = await getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, message: 'Требуется авторизация' })
  }

  const query = getQuery(event)
  const status = query.status as ContractStatus | undefined
  const limit = Number(query.limit) || 50

  let dbQuery = supabase
    .from('contracts_view')
    .select('*')
    .eq('user_id', sessionUser.id)
    .order('date_created', { ascending: false })
    .limit(limit)

  if (status) {
    dbQuery = dbQuery.eq('status', status)
  }

  const { data, error } = await dbQuery

  if (error) {
    console.error('Error fetching contracts:', error)
    throw createError({ statusCode: 500, message: 'Ошибка загрузки договоров' })
  }

  const contracts: Contract[] = (data as ContractRow[]).map(row => ({
    id: row.id,
    contractNumber: row.contract_number,
    userId: row.user_id,
    status: row.status,
    tariffName: row.tariff_name,
    monthlyFee: row.monthly_fee,
    connectionAddress: row.connection_address,
    createdAt: row.date_created,
    updatedAt: row.date_updated,
  }))

  return { contracts }
})
