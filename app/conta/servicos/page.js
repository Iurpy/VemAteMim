import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/usuario'
import ListaServicos from './ListaServicos'

export const metadata = { title: 'Meus serviços | Vem Até Mim' }

export default async function PaginaServicos({ searchParams }) {
  const { tipo } = await usuarioAtual()
  if (tipo !== 'profissional') redirect('/conta')
  const { aviso } = await searchParams
  return <ListaServicos aviso={aviso} />
}
