'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import { traduzirErro } from '@/lib/erros'
import { DIAS, FUSO, HORARIOS, horaCurta } from '@/lib/profissional'
import CabecalhoBranco from '@/components/CabecalhoBranco'

const fuso = 'America/Fortaleza'
const hojeISO = () => new Date().toLocaleDateString('en-CA', { timeZone: fuso }) // AAAA-MM-DD
const diaSeguinte = (iso) => {
  const d = new Date(`${iso}T12:00:00${FUSO}`)
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-CA', { timeZone: fuso })
}
const dataCurta = (ts) => new Date(ts).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: fuso })
const horaDe = (ts) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: fuso })

// Descreve uma folga em português: dia inteiro, vários dias ou parte do dia
function descreverFolga(b) {
  const ini = new Date(b.inicio), fim = new Date(b.fim)
  const diaInteiro = horaDe(b.inicio) === '00:00' && horaDe(b.fim) === '00:00'
  if (diaInteiro) {
    const ultimoDia = new Date(fim.getTime() - 1)
    return dataCurta(ini) === dataCurta(ultimoDia)
      ? `${dataCurta(ini)}, o dia todo`
      : `De ${dataCurta(ini)} até ${dataCurta(ultimoDia)}`
  }
  return `${dataCurta(ini)}, das ${horaDe(b.inicio)} às ${horaDe(b.fim)}`
}

export default function Horarios() {
  const [userId, setUserId] = useState(null)
  const [periodos, setPeriodos] = useState(null)
  const [folgas, setFolgas] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Formulário de horário da semana
  const [dias, setDias] = useState([])
  const [inicio, setInicio] = useState('08:00')
  const [fim, setFim] = useState('12:00')
  const [erroPeriodo, setErroPeriodo] = useState('')

  // Formulário de folga
  const [folga, setFolga] = useState({ de: '', ate: '', parteDoDia: false, horaIni: '08:00', horaFim: '12:00', motivo: '' })
  const [erroFolga, setErroFolga] = useState('')

  async function carregar() {
    const supabase = criarClienteNavegador()
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user.id)
    const [{ data: d, error: e1 }, { data: b, error: e2 }] = await Promise.all([
      supabase.from('disponibilidade').select('*').eq('profissional_id', user.id).order('hora_inicio'),
      supabase.from('bloqueios').select('*').eq('profissional_id', user.id)
        .gte('fim', new Date().toISOString()).order('inicio'),
    ])
    if (e1 || e2) setMensagem(traduzirErro(e1 || e2))
    setPeriodos(d ?? [])
    setFolgas(b ?? [])
  }
  useEffect(() => { carregar() }, [])

  const alternarDia = (v) => setDias((atual) => (atual.includes(v) ? atual.filter((d) => d !== v) : [...atual, v]))

  // CREATE: um período para cada dia marcado
  async function adicionarPeriodo() {
    setErroPeriodo(''); setSucesso(''); setMensagem('')
    if (!dias.length) return setErroPeriodo('Marque pelo menos um dia da semana.')
    if (fim <= inicio) return setErroPeriodo('O horário de fim precisa ser depois do início.')
    const conflito = DIAS.find((d) => dias.includes(d.valor) && periodos.some((p) =>
      p.dia_semana === d.valor && inicio < horaCurta(p.hora_fim) && fim > horaCurta(p.hora_inicio)))
    if (conflito) return setErroPeriodo(`Esse horário bate com outro que você já tem na ${conflito.nome.toLowerCase()}.`)

    const supabase = criarClienteNavegador()
    const { error } = await supabase.from('disponibilidade').insert(
      dias.map((d) => ({ profissional_id: userId, dia_semana: d, hora_inicio: inicio, hora_fim: fim }))
    )
    if (error) return setErroPeriodo(traduzirErro(error))
    setSucesso(`Horário das ${inicio} às ${fim} adicionado.`)
    setDias([])
    carregar()
  }

  // DELETE de um período
  async function excluirPeriodo(p) {
    const supabase = criarClienteNavegador()
    const { error } = await supabase.from('disponibilidade').delete().eq('id', p.id)
    if (error) return setMensagem(traduzirErro(error))
    setSucesso('Horário excluído.')
    carregar()
  }

  // CREATE de folga
  async function adicionarFolga() {
    setErroFolga(''); setSucesso(''); setMensagem('')
    const de = folga.de
    const ate = folga.parteDoDia ? folga.de : (folga.ate || folga.de)
    if (!de) return setErroFolga('Escolha o dia da folga.')
    if (de < hojeISO()) return setErroFolga('A folga precisa ser de hoje em diante.')
    if (ate < de) return setErroFolga('O último dia precisa ser depois do primeiro.')
    if (folga.parteDoDia && folga.horaFim <= folga.horaIni) return setErroFolga('O horário de fim precisa ser depois do início.')

    const registro = folga.parteDoDia
      ? { inicio: `${de}T${folga.horaIni}:00${FUSO}`, fim: `${de}T${folga.horaFim}:00${FUSO}` }
      : { inicio: `${de}T00:00:00${FUSO}`, fim: `${diaSeguinte(ate)}T00:00:00${FUSO}` }

    const supabase = criarClienteNavegador()
    const { error } = await supabase.from('bloqueios').insert({
      ...registro, profissional_id: userId, motivo: folga.motivo.trim() || null,
    })
    if (error) return setErroFolga(traduzirErro(error))
    setSucesso('Folga adicionada. Nesse período ninguém consegue agendar com você.')
    setFolga({ de: '', ate: '', parteDoDia: false, horaIni: '08:00', horaFim: '12:00', motivo: '' })
    carregar()
  }

  async function excluirFolga(b) {
    const supabase = criarClienteNavegador()
    const { error } = await supabase.from('bloqueios').delete().eq('id', b.id)
    if (error) return setMensagem(traduzirErro(error))
    setSucesso('Folga excluída.')
    carregar()
  }

  if (periodos === null) return <p className="pagina-branca carregando" role="status">Carregando seus horários...</p>

  return (
    <div className="pagina-branca formulario">
      <CabecalhoBranco titulo="Meus horários" voltar="/conta" rotuloVoltar="Voltar para o início" />

      {sucesso && <div className="aviso sucesso" role="status"><p><strong>{sucesso}</strong></p></div>}
      {mensagem && <div className="aviso erro" role="alert"><p>{mensagem}</p></div>}

      {/* ---------------- Semana ---------------- */}
      <section className="grupo" aria-labelledby="titulo-semana">
        <h2 id="titulo-semana">Horários da semana</h2>
        <p className="fraco">
          Os clientes só conseguem agendar dentro desses horários. Entre um atendimento e outro,
          o site deixa 30 minutos para o seu deslocamento.
        </p>

        <ul className="semana">
          {DIAS.map((d) => {
            const doDia = periodos.filter((p) => p.dia_semana === d.valor)
            return (
              <li key={d.valor}>
                <strong className="semana-dia">{d.nome}</strong>
                {doDia.length === 0 ? (
                  <span className="fraco">Não atendo</span>
                ) : (
                  <ul className="periodos">
                    {doDia.map((p) => (
                      <li key={p.id}>
                        <span>{horaCurta(p.hora_inicio)} às {horaCurta(p.hora_fim)}</span>
                        <button type="button" className="botao-icone"
                          aria-label={`Excluir ${d.nome}, das ${horaCurta(p.hora_inicio)} às ${horaCurta(p.hora_fim)}`}
                          onClick={() => excluirPeriodo(p)}>
                          <Trash2 size={20} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        <div className="caixa-adicionar">
          <h3>Adicionar horário</h3>
          <fieldset className="dias-semana">
            <legend>Em quais dias?</legend>
            {DIAS.map((d) => (
              <label key={d.valor} className="opcao dia">
                <input type="checkbox" checked={dias.includes(d.valor)} onChange={() => alternarDia(d.valor)} />
                <span>{d.medio}</span>
              </label>
            ))}
          </fieldset>
          <div className="linha">
            <div className="campo">
              <label htmlFor="hora-inicio">Começo</label>
              <select id="hora-inicio" value={inicio} onChange={(e) => setInicio(e.target.value)}>
                {HORARIOS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="hora-fim">Fim</label>
              <select id="hora-fim" value={fim} onChange={(e) => setFim(e.target.value)}>
                {HORARIOS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
          </div>
          {erroPeriodo && <p className="erro-campo" role="alert">{erroPeriodo}</p>}
          <button type="button" className="botao largo" onClick={adicionarPeriodo}>
            <Plus size={22} aria-hidden="true" /> Adicionar horário
          </button>
        </div>
      </section>

      {/* ---------------- Folgas ---------------- */}
      <section className="grupo" aria-labelledby="titulo-folgas">
        <h2 id="titulo-folgas">Folgas e imprevistos</h2>
        <p className="fraco">Dias ou períodos em que você não vai atender, como uma viagem ou consulta.</p>

        {folgas?.length ? (
          <ul className="lista-folgas">
            {folgas.map((b) => (
              <li key={b.id}>
                <span>
                  <strong>{descreverFolga(b)}</strong>
                  {b.motivo && <span className="fraco"> ({b.motivo})</span>}
                </span>
                <button type="button" className="botao-icone" aria-label={`Excluir folga: ${descreverFolga(b)}`}
                  onClick={() => excluirFolga(b)}>
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fraco">Nenhuma folga marcada.</p>
        )}

        <div className="caixa-adicionar">
          <h3>Adicionar folga</h3>
          <div className="linha">
            <div className="campo">
              <label htmlFor="folga-de">{folga.parteDoDia ? 'Dia' : 'Primeiro dia'}</label>
              <input id="folga-de" type="date" min={hojeISO()} value={folga.de}
                onChange={(e) => setFolga({ ...folga, de: e.target.value })} />
            </div>
            {!folga.parteDoDia && (
              <div className="campo">
                <label htmlFor="folga-ate">Último dia <span className="opcional">(opcional)</span></label>
                <input id="folga-ate" type="date" min={folga.de || hojeISO()} value={folga.ate}
                  onChange={(e) => setFolga({ ...folga, ate: e.target.value })} />
              </div>
            )}
          </div>
          <label className="opcao">
            <input type="checkbox" checked={folga.parteDoDia}
              onChange={(e) => setFolga({ ...folga, parteDoDia: e.target.checked })} />
            <span>Só uma parte do dia</span>
          </label>
          {folga.parteDoDia && (
            <div className="linha">
              <div className="campo">
                <label htmlFor="folga-hora-ini">Das</label>
                <select id="folga-hora-ini" value={folga.horaIni} onChange={(e) => setFolga({ ...folga, horaIni: e.target.value })}>
                  {HORARIOS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="folga-hora-fim">Até</label>
                <select id="folga-hora-fim" value={folga.horaFim} onChange={(e) => setFolga({ ...folga, horaFim: e.target.value })}>
                  {HORARIOS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="campo">
            <label htmlFor="folga-motivo">Motivo <span className="opcional">(opcional, só você vê)</span></label>
            <input id="folga-motivo" type="text" maxLength={200} value={folga.motivo}
              onChange={(e) => setFolga({ ...folga, motivo: e.target.value })} />
          </div>
          {erroFolga && <p className="erro-campo" role="alert">{erroFolga}</p>}
          <button type="button" className="botao largo" onClick={adicionarFolga}>
            <Plus size={22} aria-hidden="true" /> Adicionar folga
          </button>
        </div>
      </section>
    </div>
  )
}
