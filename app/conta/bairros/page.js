import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/usuario'
import FormBairros from './FormBairros'

export const metadata = { title: 'Onde eu atendo | Vem Até Mim' }

export default async function PaginaBairros() {
  const { tipo } = await usuarioAtual()
  if (tipo !== 'profissional') redirect('/conta')
  return <FormBairros />
}
