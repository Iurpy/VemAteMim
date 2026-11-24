'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarClienteNavegador } from '@/lib/supabase/client'
import { traduzirErro } from '@/lib/erros'
import {
  COMISSAO, DURACOES, TAXA, brl, lerPreco, precoParaTela, textoDuracao,
} from '@/lib/profissional'
import Campo from '@/components/Campo'
import ResumoErros from '@/components/ResumoErros'
import CabecalhoBranco from '@/components/CabecalhoBranco'

// Formulário para ADICIONAR (sem servicoId) e EDITAR (com servicoId)
// um serviço da profissional. Na edição também dá para EXCLUIR.
export default function FormServico({ servicoId }) {
  const router = useRouter()
  const editando = !!servicoId
  const [carregando, setCarregando] = useState(true)
  const [userId, setUserId] = useState(null)
  const [catalogo, setCatalogo] = useState([])
  const [dados, setDados] = useState({ servico_id: '', titulo: '', descricao: '', preco: '', duracao_min: '' })
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)

  useEffect(() => {
    async function carregar() {
      const supabase = criarClienteNavegador()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)
      const [{ data: servicos }, { data: meus }] = await Promise.all([
        supabase.from('servicos').select('id, nome, descricao, duracao_min, exige_revisao').order('id'),
        supabase.from('profissional_servicos').select('*').eq('profissional_id', user.id),
      ])
      if (editando) {
        const atual = meus?.find((m) => m.servico_id === servicoId)
        if (!atual) { setMensagem('Esse serviço não foi encontrado.'); setCarregando(false); return }
        setDados({
          servico_id: String(atual.servico_id),
          titulo: atual.titulo || '',
          descricao: atual.descricao || '',
          preco: precoParaTela(atual.preco),
          duracao_min: String(atual.duracao_min),
        })
        setCatalogo(servicos ?? [])
      } else {
        // Na hora de adicionar, só mostra o que ela ainda não tem
        const jaTem = new Set((meus ?? []).map((m) => m.servico_id))
        setCatalogo((servicos ?? []).filter((s) => !jaTem.has(s.id)))
      }
      setCarregando(false)
    }
    carregar()
  }, [editando, servicoId])

  const categoria = catalogo.find((s) => String(s.id) === dados.servico_id)
  const ehOutro = !!categoria?.exige_revisao
  const preco = lerPreco(dados.preco)

  function alterar(campo, valor) {
    setDados((atual) => {
      const novo = { ...atual, [campo]: valor }
      // Ao escolher a categoria, sugere a duração padrão dela
      if (campo === 'servico_id') {
        const c = catalogo.find((s) => String(s.id) === valor)
        if (c) novo.duracao_min = String(c.duracao_min)
      }
      return novo
    })
  }

  function validar() {
    const e = {}
    if (!dados.servico_id) e.servico_id = 'Escolha o serviço.'
    if (ehOutro && dados.titulo.trim().length < 3) e.titulo = 'Escreva o nome do serviço que você faz.'
    if (dados.titulo.trim() && dados.titulo.trim().length < 3) e.titulo = 'O nome precisa ter pelo menos 3 letras.'
    if (ehOutro && !dados.descricao.trim()) e.descricao = 'Explique em poucas palavras o que você faz.'
    if (!preco || preco <= 0) e.preco = 'Digite o seu preço, por exemplo 50,00.'
    if (!dados.duracao_min) e.duracao_min = 'Escolha quanto tempo leva.'
    return e
  }

  // CREATE ou UPDATE
  async function salvar(evento) {
    evento.preventDefault()
    setMensagem('')
    const e = validar()
    setErros(e)
    if (Object.keys(e).length) return

    const registro = {
      titulo: dados.titulo.trim() || null,
      descricao: dados.descricao.trim() || null,
      preco,
      duracao_min: Number(dados.duracao_min),
    }

    setSalvando(true)
    const supabase = criarClienteNavegador()
    const { error } = editando
      ? await supabase.from('profissional_servicos').update(registro)
          .eq('profissional_id', userId).eq('servico_id', servicoId)
      : await supabase.from('profissional_servicos')
          .insert({ ...registro, profissional_id: userId, servico_id: Number(dados.servico_id) })
    setSalvando(false)

    if (error) return setMensagem(traduzirErro(error))
    router.push(`/conta/servicos?aviso=${editando ? 'salvo' : 'criado'}`)
    router.refresh()
  }

  // DELETE
  async function excluir() {
    const supabase = criarClienteNavegador()
    const { error } = await supabase.from('profissional_servicos').delete()
      .eq('profissional_id', userId).eq('servico_id', servicoId)
    if (error) { setConfirmandoExclusao(false); return setMensagem(traduzirErro(error)) }
    router.push('/conta/servicos?aviso=excluido')
    router.refresh()
  }

  if (carregando) return <p className="pagina-branca carregando" role="status">Carregando...</p>

  return (
    <div className="pagina-branca formulario">
      <CabecalhoBranco
        titulo={editando ? 'Editar serviço' : 'Adicionar serviço'}
        voltar="/conta/servicos"
        rotuloVoltar="Voltar para meus serviços"
      />

      <ResumoErros erros={erros} mensagem={mensagem} />

      {!editando && catalogo.length === 0 ? (
        <div className="vazio"><p>Você já cadastrou todos os serviços da lista.</p></div>
      ) : (
        <form onSubmit={salvar} noValidate>
          <div className={`campo${erros.servico_id ? ' com-erro' : ''}`}>
            <label htmlFor="servico_id">Qual serviço?</label>
            {editando ? (
              <p className="valor-fixo" id="servico_id">{categoria?.nome}</p>
            ) : (
              <select
                id="servico_id" value={dados.servico_id}
                onChange={(e) => alterar('servico_id', e.target.value)}
                aria-invalid={erros.servico_id ? true : undefined}
                aria-describedby={erros.servico_id ? 'servico_id-erro' : undefined}
              >
                <option value="">Escolha da lista</option>
                {catalogo.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            )}
            {erros.servico_id && <p id="servico_id-erro" className="erro-campo">{erros.servico_id}</p>}
          </div>

          {ehOutro && (
            <div className="aviso info">
              <p>
                Serviços fora da lista passam por uma revisão rápida da equipe antes de aparecer na busca.
                Serviços de saúde, como fisioterapia e enfermagem, ainda não são aceitos.
              </p>
            </div>
          )}

          <Campo
            id="titulo"
            rotulo={ehOutro ? 'Nome do serviço' : 'Nome que aparece para o cliente'}
            opcional={!ehOutro}
            ajuda={ehOutro ? 'Ex.: Massagem nas mãos' : `Se deixar em branco, aparece "${categoria?.nome ?? 'o nome da lista'}".`}
            maxLength={80}
            value={dados.titulo}
            onChange={(e) => alterar('titulo', e.target.value)}
            erro={erros.titulo}
          />

          <Campo
            id="descricao"
            rotulo="Como é o seu atendimento"
            opcional={!ehOutro}
            ajuda="Ex.: Levo todo o material esterilizado e esmaltes de várias cores."
            multilinha
            rows={3}
            maxLength={500}
            value={dados.descricao}
            onChange={(e) => alterar('descricao', e.target.value)}
            erro={erros.descricao}
          />

          <div className="linha">
            <Campo
              id="preco"
              rotulo="Seu preço (R$)"
              inputMode="decimal"
              ajuda="Ex.: 50,00"
              value={dados.preco}
              onChange={(e) => alterar('preco', e.target.value)}
              erro={erros.preco}
            />
            <div className={`campo${erros.duracao_min ? ' com-erro' : ''}`}>
              <label htmlFor="duracao_min">Quanto tempo leva</label>
              <p className="ajuda">Sem contar o deslocamento</p>
              <select
                id="duracao_min" value={dados.duracao_min}
                onChange={(e) => alterar('duracao_min', e.target.value)}
                aria-invalid={erros.duracao_min ? true : undefined}
              >
                <option value="">Escolha</option>
                {DURACOES.map((d) => <option key={d} value={d}>{textoDuracao(d)}</option>)}
              </select>
              {erros.duracao_min && <p className="erro-campo">{erros.duracao_min}</p>}
            </div>
          </div>

          {preco > 0 && (
            <div className="resumo-preco" aria-live="polite">
              <p>O cliente paga <strong>{brl(preco + TAXA)}</strong> (seu preço + {brl(TAXA)} de taxa).</p>
              <p>Você recebe <strong>{brl(preco * (1 - COMISSAO))}</strong> por atendimento.</p>
            </div>
          )}

          <button type="submit" className="botao largo" disabled={salvando}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar serviço'}
          </button>
        </form>
      )}

      {editando && (
        <div className="zona-excluir">
          {confirmandoExclusao ? (
            <div className="confirmar" role="group" aria-label="Confirmar exclusão do serviço">
              <p>Excluir este serviço? Ele some da busca e não pode ser desfeito.</p>
              <div className="acoes" style={{ marginTop: 0 }}>
                <button type="button" className="botao perigo" onClick={excluir}>Sim, excluir</button>
                <button type="button" className="botao secundario" onClick={() => setConfirmandoExclusao(false)} autoFocus>Não, manter</button>
              </div>
            </div>
          ) : (
            <button type="button" className="botao perigo-contorno largo" onClick={() => setConfirmandoExclusao(true)}>
              Excluir este serviço
            </button>
          )}
          <p className="fraco" style={{ marginTop: '0.8rem' }}>
            Quer só parar por um tempo? Use <Link href="/conta/servicos">Pausar</Link> na lista.
          </p>
        </div>
      )}
    </div>
  )
}
