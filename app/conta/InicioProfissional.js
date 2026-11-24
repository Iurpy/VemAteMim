import Link from 'next/link'
import { Briefcase, Check, ChevronRight, Clock, MapPin } from 'lucide-react'
import TopoAzul from '@/components/TopoAzul'
import BotaoLeitura from '@/components/BotaoLeitura'
import CartaoAgendamento from '@/components/CartaoAgendamento'
import { CAMPOS_AGENDAMENTO } from '@/lib/agendamentos'

// Início para quem é profissional: o que falta para aparecer na busca
// e os próximos atendimentos
export default async function InicioProfissional({ supabase, user }) {
  const [{ data: perfil }, { data: prof }, { count: servicosVisiveis }, { count: horarios }, { data: proximos }] =
    await Promise.all([
      supabase.from('perfis').select('nome, cep, bairro, cidade, uf').eq('id', user.id).single(),
      supabase.from('profissionais').select('bairros_atendidos, bloqueado').eq('id', user.id).single(),
      supabase.from('profissional_servicos').select('servico_id', { count: 'exact', head: true })
        .eq('profissional_id', user.id).eq('situacao', 'aprovado').eq('ativo', true),
      supabase.from('disponibilidade').select('id', { count: 'exact', head: true }).eq('profissional_id', user.id),
      supabase.from('agendamentos').select(CAMPOS_AGENDAMENTO)
        .eq('profissional_id', user.id).gte('inicio', new Date().toISOString())
        .neq('status', 'cancelado').order('inicio').limit(4),
    ])

  const primeiroNome = perfil?.nome?.split(' ')[0] ?? ''
  const passos = [
    { feito: !!perfil?.cep, titulo: 'Seu endereço', texto: 'De onde você sai para atender', href: '/conta/perfil' },
    { feito: (prof?.bairros_atendidos?.length ?? 0) > 0, titulo: 'Bairros onde atende', texto: 'Quem mora neles encontra você primeiro', href: '/conta/bairros' },
    { feito: (servicosVisiveis ?? 0) > 0, titulo: 'Seus serviços e preços', texto: 'Pelo menos um serviço ativo', href: '/conta/servicos' },
    { feito: (horarios ?? 0) > 0, titulo: 'Seus horários', texto: 'Os dias e horários em que você atende', href: '/conta/horarios' },
  ]
  const faltam = passos.filter((p) => !p.feito).length
  // Para aparecer na busca bastam bairros e um serviço; endereço e horários completam o cadastro
  const naBusca = passos[1].feito && passos[2].feito && !prof?.bloqueado

  return (
    <>
      <TopoAzul>
        <div className="topo-linha">
          <div className="saudacao">
            <span className="avatar" aria-hidden="true">{primeiroNome.charAt(0).toUpperCase()}</span>
            <div>
              <span className="saudacao-pequena">Profissional</span>
              <h1>Olá, {primeiroNome}!</h1>
            </div>
          </div>
          <BotaoLeitura />
        </div>
        {perfil?.bairro && (
          <p className="local"><MapPin size={18} aria-hidden="true" /> {perfil.bairro}, {perfil.cidade} - {perfil.uf}</p>
        )}
        <p className="situacao-busca">
          {prof?.bloqueado
            ? 'Seu perfil está suspenso. Fale com a equipe.'
            : naBusca
              ? 'Você já aparece na busca para as famílias.'
              : 'Você ainda não aparece na busca.'}
        </p>
      </TopoAzul>

      <div className="folha">
        {faltam > 0 && (
          <>
            <div className="secao-titulo">
              <h2>Complete seu cadastro</h2>
              <span className="fraco">{4 - faltam} de 4</span>
            </div>
            <ol className="checklist">
              {passos.map((p) => (
                <li key={p.href} className={p.feito ? 'feito' : ''}>
                  <Link href={p.href}>
                    <span className="check-marca" aria-hidden="true">{p.feito && <Check size={18} strokeWidth={3} />}</span>
                    <span className="cartao-link-texto">
                      <strong>{p.titulo}</strong>
                      <span>{p.feito ? 'Pronto' : p.texto}</span>
                    </span>
                    <ChevronRight size={22} aria-hidden="true" className="cartao-link-seta" />
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="secao-titulo">
          <h2>Próximos atendimentos</h2>
          {proximos?.length > 0 && (
            <Link href="/conta/agenda" className="ver-todos">Ver agenda <ChevronRight size={18} aria-hidden="true" /></Link>
          )}
        </div>
        {proximos?.length ? (
          <ul className="lista-agendamentos">
            {proximos.map((a) => <CartaoAgendamento key={a.id} a={a} visao="profissional" />)}
          </ul>
        ) : (
          <div className="vazio"><p>Nenhum atendimento marcado ainda.</p></div>
        )}

        <div className="secao-titulo"><h2>Atalhos</h2></div>
        <ul className="grade-atalhos">
          <li>
            <Link href="/conta/servicos" className="tile-servico">
              <span className="tile-icone" aria-hidden="true"><Briefcase size={26} /></span>
              <strong>Meus serviços</strong><span>Preços e duração</span>
            </Link>
          </li>
          <li>
            <Link href="/conta/bairros" className="tile-servico">
              <span className="tile-icone" aria-hidden="true"><MapPin size={26} /></span>
              <strong>Onde atendo</strong><span>Bairros</span>
            </Link>
          </li>
          <li>
            <Link href="/conta/horarios" className="tile-servico">
              <span className="tile-icone" aria-hidden="true"><Clock size={26} /></span>
              <strong>Horários</strong><span>Semana e folgas</span>
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
