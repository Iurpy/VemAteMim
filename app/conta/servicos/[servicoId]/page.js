import FormServico from '../FormServico'

export const metadata = { title: 'Editar serviço | Vem Até Mim' }

export default async function PaginaEditarServico({ params }) {
  const { servicoId } = await params
  return <FormServico servicoId={Number(servicoId)} />
}
