'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Calendar, Clock, House, Search, User } from 'lucide-react'
import Logo from './Logo'

const MENU_CLIENTE = [
  { href: '/conta', rotulo: 'Início', Icone: House },
  { href: '/buscar', rotulo: 'Buscar', Icone: Search },
  { href: '/conta/agenda', rotulo: 'Agenda', Icone: Calendar },
  { href: '/conta/perfil', rotulo: 'Perfil', Icone: User, tambem: ['/conta/familia'] },
]

const MENU_PROFISSIONAL = [
  { href: '/conta', rotulo: 'Início', Icone: House },
  { href: '/conta/servicos', rotulo: 'Serviços', Icone: Briefcase },
  { href: '/conta/horarios', rotulo: 'Horários', Icone: Clock },
  { href: '/conta/agenda', rotulo: 'Agenda', Icone: Calendar },
  { href: '/conta/perfil', rotulo: 'Perfil', Icone: User, tambem: ['/conta/familia', '/conta/bairros'] },
]

export default function NavInferior({ tipo = 'cliente' }) {
  const caminho = usePathname()
  const itens = tipo === 'profissional' ? MENU_PROFISSIONAL : MENU_CLIENTE
  const ativo = (item) =>
    item.href === '/conta'
      ? caminho === '/conta'
      : [item.href, ...(item.tambem ?? [])].some((h) => caminho.startsWith(h))

  return (
    <nav className="nav-inferior" aria-label="Menu principal">
      <div className="nav-logo"><Logo href="/conta" escuro /></div>
      <ul style={{ '--itens': itens.length }}>
        {itens.map((item) => (
          <li key={item.href}>
            <Link href={item.href} aria-current={ativo(item) ? 'page' : undefined}>
              <span className="nav-icone"><item.Icone size={24} aria-hidden="true" /></span>
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
