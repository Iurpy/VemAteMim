'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import { traduzirErro } from '@/lib/erros'
import { COMISSAO, SITUACAO_SERVICO, TAXA, brl, textoDuracao } from '@/lib/profissional'
import CabecalhoBranco from '@/components/CabecalhoBranco'
import { infoServico } from '@/components/IconeServico'

const AVISOS = { criado: 'Serviço cadastrado.', salvo: 'Alterações salvas.', excluido: 'Serviço excluído.' }

export default function ListaServicos({ aviso }) {
  const [servicos, setServicos] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [sucesso, setSucesso] = useState(AVISOS[aviso] || '')

  // READ: os serviços desta profissional, com o nome da categoria
  async function carregar() {
    const supabase = criarClienteNavegador()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profissional_servicos')
      .select('*, servicos(nome)')
      .eq('profissional_id', user.id)
      .order('criado_em')
    if (error) setMensagem(traduzirErro(error))
    setServicos(data ?? [])
  }
  useEffect(() => { carregar() }, [])

  // UPDATE rápido: pausar ou voltar a oferecer
  async function alternarAtivo(s) {
    const supabase = criarClienteNavegador()
    const { error } = await supabase
      .from('profissional_servicos')
      .update({ ativo: !s.ativo })
      .eq('profissional_id', s.profissional_id).eq('servico_id', s.servico_id)
    if (error) return setMensagem(traduzirErro(error))
    setSucesso(s.ativo ? 'Serviço pausado. Ele não aparece mais na busca.' : 'Serviço ativo de novo.')
    carregar()
  }

  return (
    <div className="pagina-branca">
      <CabecalhoBranco titulo="Meus serviços" voltar="/conta" rotuloVoltar="Voltar para o início" />
      <p className="fraco">
        O cliente paga o seu preço mais {brl(TAXA)} de taxa. Você recebe {100 - COMISSAO * 100}% do seu preço.
      </p>

      {sucesso && <div className="aviso sucesso" role="status"><p><strong>{sucesso}</strong></p></div>}
      {mensagem && <div className="aviso erro" role="alert"><p>{mensagem}</p></div>}

      <p><Link href="/conta/servicos/novo" className="botao largo"><Plus size={22} aria-hidden="true" /> Adicionar serviço</Link></p>

      {servicos === null && <p className="carregando" role="status">Carregando seus serviços...</p>}

      {servicos?.length === 0 && (
        <div className="vazio">
          <p>Você ainda não cadastrou nenhum serviço.</p>
          <p className="fraco">Escolha da lista o que você faz e defina o seu preço.</p>
        </div>
      )}

      {servicos?.length > 0 && (
        <ul className="lista">
          {servicos.map((s) => {
            const categoria = s.servicos?.nome
            const { Icone } = infoServico(categoria)
            const situacao = s.ativo ? SITUACAO_SERVICO[s.situacao] : { rotulo: 'Pausado', classe: 'neutro' }
            return (
              <li key={s.servico_id} className="item item-servico">
                <div className="item-servico-topo">
                  <span className="tile-icone" aria-hidden="true"><Icone size={24} /></span>
                  <div>
                    <h2 className="h3">{s.titulo || categoria}</h2>
                    {s.titulo && <p className="fraco">{categoria}</p>}
                    <span className={`chip-status ${situacao.classe}`}>{situacao.rotulo}</span>
                  </div>
                </div>
                {s.situacao === 'recusado' && s.motivo_recusa && (
                  <p className="motivo"><strong>Motivo:</strong> {s.motivo_recusa}</p>
                )}
                <p className="preco-linha">
                  <strong>{brl(s.preco)}</strong>, {textoDuracao(s.duracao_min)}
                </p>
                <p className="fraco">O cliente paga {brl(Number(s.preco) + TAXA)}. Você recebe {brl(Number(s.preco) * (1 - COMISSAO))}.</p>
                <div className="acoes-item">
                  <Link href={`/conta/servicos/${s.servico_id}`} className="botao pequeno secundario">
                    <Pencil size={18} aria-hidden="true" /> Editar<span className="so-leitor"> {s.titulo || categoria}</span>
                  </Link>
                  <button type="button" className="botao pequeno secundario" onClick={() => alternarAtivo(s)}>
                    {s.ativo ? 'Pausar' : 'Voltar a oferecer'}<span className="so-leitor"> {s.titulo || categoria}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
