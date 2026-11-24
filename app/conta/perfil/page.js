import Link from 'next/link'
import { ChevronRight, Clock, MapPin, Users } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import TopoAzul from '@/components/TopoAzul'
import BotaoLeitura from '@/components/BotaoLeitura'
import BotaoSair from '@/components/BotaoSair'
import FormPerfil from './FormPerfil'

export const metadata = { title: 'Meu perfil | Vem Até Mim' }

export default async function PaginaPerfil() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: perfil }, { count }] = await Promise.all([
    supabase.from('perfis').select('nome, tipo').eq('id', user.id).single(),
    supabase.from('familiares').select('id', { count: 'exact', head: true }),
  ])
  const nome = perfil?.nome ?? ''

  return (
    <>
      <TopoAzul>
        <div className="topo-linha">
          <div className="saudacao">
            <span className="avatar" aria-hidden="true">{nome.charAt(0).toUpperCase()}</span>
            <div>
              <span className="saudacao-pequena">{perfil?.tipo === 'profissional' ? 'Profissional' : 'Cliente'}</span>
              <h1>{nome}</h1>
            </div>
          </div>
          <BotaoLeitura />
        </div>
      </TopoAzul>

      <div className="folha">
        {perfil?.tipo === 'profissional' && (
          <>
            <Link href="/conta/bairros" className="cartao-link">
              <span className="tile-icone" aria-hidden="true"><MapPin size={24} /></span>
              <span className="cartao-link-texto">
                <strong>Onde eu atendo</strong>
                <span>Bairros e apresentação</span>
              </span>
              <ChevronRight size={22} aria-hidden="true" className="cartao-link-seta" />
            </Link>
            <Link href="/conta/horarios" className="cartao-link">
              <span className="tile-icone" aria-hidden="true"><Clock size={24} /></span>
              <span className="cartao-link-texto">
                <strong>Meus horários</strong>
                <span>Dias da semana e folgas</span>
              </span>
              <ChevronRight size={22} aria-hidden="true" className="cartao-link-seta" />
            </Link>
          </>
        )}

        <Link href="/conta/familia" className="cartao-link">
          <span className="tile-icone" aria-hidden="true"><Users size={24} /></span>
          <span className="cartao-link-texto">
            <strong>Minha família</strong>
            <span>
              {count
                ? `${count} ${count === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}`
                : 'Cadastre quem você quer ajudar, como pais ou avós'}
            </span>
          </span>
          <ChevronRight size={22} aria-hidden="true" className="cartao-link-seta" />
        </Link>

        <h2 className="titulo-secao-perfil">Meus dados</h2>
        <FormPerfil />

        <div className="sair">
          <BotaoSair />
        </div>
      </div>
    </>
  )
}
