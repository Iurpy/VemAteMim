import NavInferior from '@/components/NavInferior'
import { usuarioAtual } from '@/lib/usuario'
import BuscaProfissionais from './BuscaProfissionais'

export const metadata = { title: 'Buscar profissionais | Vem Até Mim' }

export default async function PaginaBuscar({ searchParams }) {
  const { q, servico } = await searchParams
  const { tipo } = await usuarioAtual()
  return (
    <div className="com-nav">
      <BuscaProfissionais buscaInicial={q ?? ''} servicoInicial={servico ? Number(servico) : null} />
      <NavInferior tipo={tipo ?? 'cliente'} />
    </div>
  )
}
