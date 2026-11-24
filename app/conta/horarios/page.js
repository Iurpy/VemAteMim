import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/usuario'
import Horarios from './Horarios'

export const metadata = { title: 'Meus horários | Vem Até Mim' }

export default async function PaginaHorarios() {
  const { tipo } = await usuarioAtual()
  if (tipo !== 'profissional') redirect('/conta')
  return <Horarios />
}
