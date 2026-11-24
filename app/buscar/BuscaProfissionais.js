'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { MapPin, Search, SlidersHorizontal, Star } from 'lucide-react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import CabecalhoBranco from '@/components/CabecalhoBranco'
import { infoServico } from '@/components/IconeServico'

const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const semAcento = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export default function BuscaProfissionais({ buscaInicial, servicoInicial }) {
  const [ofertas, setOfertas] = useState(null) // null = carregando
  const [servicos, setServicos] = useState([])
  const [busca, setBusca] = useState(buscaInicial)
  const [servico, setServico] = useState(servicoInicial)
  const [bairro, setBairro] = useState('')
  const [meuBairro, setMeuBairro] = useState('')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  useEffect(() => {
    const supabase = criarClienteNavegador()
    async function carregar() {
      const [{ data: v }, { data: s }, { data: { user } }] = await Promise.all([
        supabase.from('vitrine').select('*'),
        supabase.from('servicos').select('id, nome').eq('exige_revisao', false).order('id'),
        supabase.auth.getUser(),
      ])
      setOfertas(v ?? [])
      setServicos(s ?? [])
      if (user) {
        const { data: p } = await supabase.from('perfis').select('bairro').eq('id', user.id).single()
        if (p?.bairro) setMeuBairro(p.bairro)
      }
    }
    carregar()
  }, [])

  // Junta as ofertas por profissional e aplica os filtros
  const profissionais = useMemo(() => {
    if (!ofertas) return []
    const termo = semAcento(busca.trim())
    const bairroFiltro = semAcento(bairro.trim())
    const porProfissional = new Map()

    for (const o of ofertas) {
      if (servico && o.servico_id !== servico) continue
      const texto = semAcento(`${o.titulo} ${o.categoria} ${o.profissional} ${o.bairro_base} ${(o.bairros_atendidos || []).join(' ')}`)
      if (termo && !texto.includes(termo)) continue
      if (bairroFiltro && !(o.bairros_atendidos || []).some((b) => semAcento(b).includes(bairroFiltro))) continue

      const p = porProfissional.get(o.profissional_id) ?? {
        id: o.profissional_id, nome: o.profissional, bairro: o.bairro_base,
        bairros: o.bairros_atendidos || [], nota: o.nota_media, avaliacoes: o.total_avaliacoes,
        ofertas: [],
      }
      p.ofertas.push(o)
      porProfissional.set(o.profissional_id, p)
    }

    const lista = [...porProfissional.values()]
    // Quem atende o meu bairro aparece primeiro
    // "Jereissati" e "Jereissati I" contam como o mesmo bairro
    const mesmoBairro = (a, b) => { const x = semAcento(a), y = semAcento(b); return x === y || x.includes(y) || y.includes(x) }
    const atendeMeu = (p) => !!meuBairro && p.bairros.some((b) => mesmoBairro(b, meuBairro))
    lista.sort((a, b) => Number(atendeMeu(b)) - Number(atendeMeu(a)) || (b.nota ?? 0) - (a.nota ?? 0))
    return lista.map((p) => ({ ...p, atendeMeu: atendeMeu(p) }))
  }, [ofertas, busca, servico, bairro, meuBairro])

  return (
    <div className="pagina-branca">
      <CabecalhoBranco titulo="Buscar profissionais" voltar="/conta" rotuloVoltar="Voltar para o início" />

      <form className="busca-linha" role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="busca-caixa clara">
          <Search size={22} aria-hidden="true" className="busca-lupa" />
          <label htmlFor="busca" className="so-leitor">Buscar por nome, serviço ou bairro</label>
          <input id="busca" type="search" placeholder="Nome, serviço ou bairro" value={busca}
            onChange={(e) => setBusca(e.target.value)} />
        </div>
        <button type="button" className="botao-filtro" aria-expanded={filtrosAbertos}
          aria-controls="filtros" onClick={() => setFiltrosAbertos(!filtrosAbertos)}>
          <SlidersHorizontal size={22} aria-hidden="true" />
          <span className="so-leitor">Filtros</span>
        </button>
      </form>

      {filtrosAbertos && (
        <div id="filtros" className="filtros">
          <label htmlFor="filtro-bairro">Bairro de quem vai receber o atendimento</label>
          <input id="filtro-bairro" type="text" value={bairro} placeholder={meuBairro || 'Ex.: Pajuçara'}
            onChange={(e) => setBairro(e.target.value)} />
        </div>
      )}

      <div className="chips" role="group" aria-label="Filtrar por serviço">
        <button type="button" aria-pressed={!servico} onClick={() => setServico(null)}>Todos</button>
        {servicos.map((s) => {
          const { Icone } = infoServico(s.nome)
          return (
            <button key={s.id} type="button" aria-pressed={servico === s.id} onClick={() => setServico(s.id)}>
              <Icone size={18} aria-hidden="true" /> {s.nome}
            </button>
          )
        })}
      </div>

      {ofertas === null ? (
        <p className="carregando" role="status">Procurando profissionais...</p>
      ) : (
        <>
          <p className="contagem" role="status">
            {profissionais.length === 1 ? '1 profissional encontrada' : `${profissionais.length} profissionais encontradas`}
          </p>

          {profissionais.length === 0 && (
            <div className="vazio">
              <p>Nenhuma profissional encontrada com esses filtros.</p>
              <p className="fraco">Tente outro serviço ou apague a busca.</p>
            </div>
          )}

          <ul className="lista-profissionais">
            {profissionais.map((p) => {
              const menor = Math.min(...p.ofertas.map((o) => Number(o.preco_total)))
              const categorias = [...new Set(p.ofertas.map((o) => o.categoria))]
              return (
                <li key={p.id} className="cartao-profissional">
                  <div className="prof-topo">
                    <span className="prof-foto" aria-hidden="true">{p.nome.charAt(0)}</span>
                    <div>
                      <h2>{p.nome}</h2>
                      <p className="prof-especialidade">{p.ofertas[0].titulo}</p>
                      <p className="prof-info">
                        {p.nota ? (
                          <><Star size={16} aria-hidden="true" className="estrela" /> {String(p.nota).replace('.', ',')} ({p.avaliacoes} {p.avaliacoes === 1 ? 'avaliação' : 'avaliações'})</>
                        ) : 'Ainda sem avaliações'}
                      </p>
                      <p className="prof-info">
                        <MapPin size={16} aria-hidden="true" /> {p.bairro}{p.atendeMeu ? ', atende o seu bairro' : ''}
                      </p>
                    </div>
                  </div>
                  <ul className="tags">
                    {categorias.slice(0, 3).map((c) => <li key={c}>{c}</li>)}
                  </ul>
                  <div className="prof-rodape">
                    <div>
                      <span className="a-partir">A partir de</span>
                      <strong className="preco">{brl(menor)}</strong>
                    </div>
                    <Link href={`/agendar/${p.id}`} className="botao">
                      Agendar<span className="so-leitor"> com {p.nome}</span>
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
