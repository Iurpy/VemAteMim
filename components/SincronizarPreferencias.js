'use client'

import { useEffect } from 'react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import { aplicarPreferencias, prefsDoPerfil } from '@/lib/preferencias'

// Ao abrir o site com login, aplica a letra e o contraste salvos no perfil
export default function SincronizarPreferencias() {
  useEffect(() => {
    const supabase = criarClienteNavegador()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('perfis')
        .select('tamanho_fonte, alto_contraste, ler_em_voz_alta')
        .eq('id', user.id)
        .single()
      if (data) aplicarPreferencias(prefsDoPerfil(data))
    })
  }, [])
  return null
}
