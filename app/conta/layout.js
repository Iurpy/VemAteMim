import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/usuario'
import NavInferior from '@/components/NavInferior'

// Toda página dentro de /conta passa por aqui: sem login, volta para /entrar
export default async function LayoutConta({ children }) {
  const { user, tipo } = await usuarioAtual()
  if (!user) redirect('/entrar')

  return (
    <div className="com-nav">
      {children}
      <NavInferior tipo={tipo} />
    </div>
  )
}
