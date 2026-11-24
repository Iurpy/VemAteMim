import Link from 'next/link'
import { ChevronRight, MapPin, Search } from 'lucide-react'
import { criarClienteServidor } from '@/lib/supabase/server'
import TopoAzul from '@/components/TopoAzul'
import BotaoLeitura from '@/components/BotaoLeitura'
import CartaoAgendamento from '@/components/CartaoAgendamento'
import { infoServico } from '@/components/IconeServico'
import { CAMPOS_AGENDAMENTO } from '@/lib/agendamentos'
import InicioProfissional from './InicioProfissional'

export const metadata = { title: 'Início | Vem Até Mim' }

const DESTAQUES = ['Manicure', 'Pedicure', 'Corte masculino', 'Corte feminino', 'Barba', 'Escova']

export default async function PaginaConta() {
  const supabase = await criarClienteServidor()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tipoPerfil } = await supabase.from('perfis').select('tipo').eq('id', user.id).single()
  if (tipoPerfil?.tipo === 'profissional') return <InicioProfissional supabase={supabase} user={user} />

  const [{ data: perfil }, { data: servicos }, { data: proximos }] = await Promise.all([
    supabase.from('perfis').select('nome, tipo, bairro, cidade, uf').eq('id', user.id).single(),
    supabase.from('servicos').select('id, nome').eq('exige_revisao', false),
    supabase
      .from('agendamentos')
      .select(CAMPOS_AGENDAMENTO)
      .eq('cliente_id', user.id)
      .gte('inicio', new Date().toISOString())
      .neq('status', 'cancelado')
      .order('inicio')
      .limit(3),
  ])

  const primeiroNome = perfil?.nome?.split(' ')[0] ?? ''
  const destaques = DESTAQUES.map((n) => servicos?.find((s) => s.nome === n)).filter(Boolean)

  return (
    <>
      <TopoAzul>
        <div className="topo-linha">
          <div className="saudacao">
            <span className="avatar" aria-hidden="true">{primeiroNome.charAt(0).toUpperCase()}</span>
            <div>
              <span className="saudacao-pequena">Bem-vindo(a),</span>
              <h1>Olá, {primeiroNome}!</h1>
            </div>
          </div>
          <BotaoLeitura />
        </div>

        {perfil?.bairro ? (
          <p className="local"><MapPin size={18} aria-hidden="true" /> {perfil.bairro}, {perfil.cidade} - {perfil.uf}</p>
        ) : (
          <p className="local"><MapPin size={18} aria-hidden="true" /> <Link href="/conta/perfil">Adicionar meu endereço</Link></p>
        )}

        <form action="/buscar" className="busca-topo" role="search">
          <label htmlFor="busca" className="busca-pergunta">Qual cuidado você precisa hoje?</label>
          <div className="busca-caixa">
            <Search size={22} aria-hidden="true" className="busca-lupa" />
            <input id="busca" name="q" type="search" placeholder="Buscar manicure, corte, barba..." />
            <button type="submit" className="botao verde">Buscar</button>
          </div>
        </form>
      </TopoAzul>

      <div className="folha">
        <div className="secao-titulo">
          <h2>Serviços</h2>
          <Link href="/buscar" className="ver-todos">Ver todos <ChevronRight size={18} aria-hidden="true" /></Link>
        </div>
        <ul className="grade-servicos">
          {destaques.map((s) => {
            const { Icone, curta } = infoServico(s.nome)
            return (
              <li key={s.id}>
                <Link href={`/buscar?servico=${s.id}`} className="tile-servico">
                  <span className="tile-icone" aria-hidden="true"><Icone size={26} /></span>
                  <strong>{s.nome}</strong>
                  {curta && <span>{curta}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="secao-titulo">
          <h2>Próximos agendamentos</h2>
          {proximos?.length > 0 && (
            <Link href="/conta/agenda" className="ver-todos">Ver agenda <ChevronRight size={18} aria-hidden="true" /></Link>
          )}
        </div>
        {proximos?.length ? (
          <ul className="lista-agendamentos">
            {proximos.map((a) => <CartaoAgendamento key={a.id} a={a} />)}
          </ul>
        ) : (
          <div className="vazio">
            <p>Você ainda não tem agendamentos.</p>
            <Link href="/buscar" className="botao">Buscar profissionais</Link>
          </div>
        )}
      </div>
    </>
  )
}
