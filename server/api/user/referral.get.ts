import { createClient } from '@supabase/supabase-js'

interface ReferralCodeRow {
  id: number
  code: string
  inviter_bonus: number
  invitee_bonus: number
  total_invited: number
  total_bonus: number
  is_active: boolean
}

interface ReferralRow {
  id: number
  invitee_user_id: number
  status: string
  inviter_bonus: number | null
  registered_at: string
  activated_at: string | null
  users: {
    first_name: string | null
    last_name: string | null
    avatar: string | null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const userId = query.userId as string

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'userId обязателен'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceKey
  )

  // Получаем реферальный код пользователя
  const { data: codeData, error: codeError } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (codeError && codeError.code !== 'PGRST116') {
    console.error('Error fetching referral code:', codeError)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при загрузке реферальной программы'
    })
  }

  // Если кода нет — создаём
  let referralCode: ReferralCodeRow
  if (!codeData) {
    const code = `PG19-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const { data: newCode, error: createError } = await supabase
      .from('referral_codes')
      .insert({ user_id: userId, code })
      .select()
      .single()

    if (createError || !newCode) {
      console.error('Error creating referral code:', createError)
      throw createError({
        statusCode: 500,
        message: 'Ошибка при создании реферального кода'
      })
    }
    referralCode = newCode
  } else {
    referralCode = codeData
  }

  // Получаем приглашённых
  const { data: referrals, error: refError } = await supabase
    .from('referrals')
    .select(`
      id,
      invitee_user_id,
      status,
      inviter_bonus,
      registered_at,
      activated_at,
      users:invitee_user_id (
        first_name,
        last_name,
        avatar
      )
    `)
    .eq('inviter_user_id', userId)
    .order('registered_at', { ascending: false })

  if (refError) {
    console.error('Error fetching referrals:', refError)
  }

  return {
    code: referralCode.code,
    link: `https://pg19.doka.team/?ref=${referralCode.code}`,
    inviterBonus: referralCode.inviter_bonus / 100, // kopeks → rubles
    inviteeBonus: referralCode.invitee_bonus / 100,
    stats: {
      totalInvited: referralCode.total_invited,
      totalBonus: referralCode.total_bonus / 100
    },
    invited: ((referrals || []) as unknown as ReferralRow[]).map(r => ({
      id: r.id,
      name: [r.users?.first_name, r.users?.last_name].filter(Boolean).join(' ') || 'Пользователь',
      avatar: r.users?.avatar || null,
      status: r.status,
      bonus: r.inviter_bonus ? r.inviter_bonus / 100 : null,
      registeredAt: r.registered_at,
      activatedAt: r.activated_at
    }))
  }
})
