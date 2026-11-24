// Traduz mensagens de erro do Supabase para português simples

export function traduzirErro(erro) {
  const original = erro?.message || ''
  const m = original.toLowerCase()

  // Mensagens que o próprio banco já escreve em português
  if (original.startsWith('Para "Outro serviço"')) return original

  if (m.includes('duplicate key'))
    return 'Isso já está cadastrado.'
  if (m.includes('fim_depois_do_inicio'))
    return 'O horário de fim precisa ser depois do horário de início.'
  if (m.includes('profissional_servicos_preco_check'))
    return 'Digite um preço maior que zero.'
  if (m.includes('titulo_check'))
    return 'O nome do serviço precisa ter entre 3 e 80 letras.'

  if (m.includes('invalid login credentials'))
    return 'E-mail ou senha incorretos. Confira e tente de novo.'
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists'))
    return 'Já existe uma conta com esse e-mail. Tente entrar.'
  if (m.includes('password') && (m.includes('at least') || m.includes('short') || m.includes('weak')))
    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email not confirmed'))
    return 'Falta confirmar seu e-mail. Abra o link que enviamos para a sua caixa de entrada.'
  if (m.includes('email') && m.includes('invalid'))
    return 'Esse e-mail não parece válido. Confira se está escrito certo.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'Sem conexão com a internet. Verifique e tente de novo.'
  if (m.includes('permission denied') || m.includes('row-level security'))
    return 'Você não tem permissão para fazer isso.'

  return 'Não foi possível concluir agora. Tente de novo em instantes.'
}
