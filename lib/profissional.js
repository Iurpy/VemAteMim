// Funções e listas usadas na área da profissional

export const DIAS = [
  { valor: 1, nome: 'Segunda-feira', medio: 'Segunda', curto: 'Seg' },
  { valor: 2, nome: 'Terça-feira', medio: 'Terça', curto: 'Ter' },
  { valor: 3, nome: 'Quarta-feira', medio: 'Quarta', curto: 'Qua' },
  { valor: 4, nome: 'Quinta-feira', medio: 'Quinta', curto: 'Qui' },
  { valor: 5, nome: 'Sexta-feira', medio: 'Sexta', curto: 'Sex' },
  { valor: 6, nome: 'Sábado', medio: 'Sábado', curto: 'Sáb' },
  { valor: 0, nome: 'Domingo', medio: 'Domingo', curto: 'Dom' },
]

// Horários de 30 em 30 minutos, das 6h às 22h
export const HORARIOS = Array.from({ length: 33 }, (_, i) => {
  const minutos = 6 * 60 + i * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

export const DURACOES = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240]
export const textoDuracao = (min) => {
  const h = Math.floor(min / 60), m = min % 60
  if (!h) return `${m} minutos`
  return `${h} hora${h > 1 ? 's' : ''}${m ? ` e ${m} minutos` : ''}`
}

export const TAXA = 3
export const COMISSAO = 0.15

export const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// "60", "60,00", "R$ 60,50" -> 60.5 (ou null se não for número)
export function lerPreco(texto) {
  const limpo = (texto || '').replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(limpo)
  return limpo && Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}
export const precoParaTela = (v) => (v == null ? '' : Number(v).toFixed(2).replace('.', ','))

export const horaCurta = (t) => (t || '').slice(0, 5) // "08:00:00" -> "08:00"

// Fortaleza não tem horário de verão: sempre 3 horas a menos que o UTC
export const FUSO = '-03:00'

export const SITUACAO_SERVICO = {
  aprovado: { rotulo: 'Aparece na busca', classe: 'ok' },
  pendente: { rotulo: 'Esperando revisão da equipe', classe: 'alerta' },
  recusado: { rotulo: 'Recusado', classe: 'neutro' },
}
