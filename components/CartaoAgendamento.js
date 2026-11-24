import { STATUS, dataHoraLonga, diaDoMes, diaSemanaCurto } from '@/lib/agendamentos'

// visao: 'cliente' mostra com quem é; 'profissional' mostra para quem e onde
export default function CartaoAgendamento({ a, visao = 'cliente' }) {
  const status = STATUS[a.status] ?? { rotulo: a.status, classe: 'neutro' }
  const profissional = a.profissionais?.perfis?.nome
  return (
    <li className="cartao-agendamento">
      <div className="data-bloco" aria-hidden="true">
        <span>{diaSemanaCurto(a.inicio)}</span>
        <strong>{diaDoMes(a.inicio)}</strong>
      </div>
      <div className="agendamento-texto">
        <div className="agendamento-topo">
          <h3>{a.servicos?.nome}</h3>
          <span className={`chip-status ${status.classe}`}>{status.rotulo}</span>
        </div>
        <p>{dataHoraLonga(a.inicio)}</p>
        <p className="fraco">
          {visao === 'profissional'
            ? `Para ${a.nome_atendido}, no ${a.bairro}`
            : `${profissional ? `Com ${profissional}, ` : ''}para ${a.nome_atendido}`}
        </p>
      </div>
    </li>
  )
}
