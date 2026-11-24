import { criarClienteServidor } from '@/lib/supabase/server'

// Busca quem está logado e o tipo de conta (no servidor)
export async function usuarioAtual() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, tipo: null }
  const { data } = await supabase.from('perfis').select('tipo').eq('id', user.id).single()
  return { supabase, user, tipo: data?.tipo ?? 'cliente' }
}
