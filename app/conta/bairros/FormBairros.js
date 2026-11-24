'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import { buscarCep, formatarCep, soDigitos } from '@/lib/formatos'
import { traduzirErro } from '@/lib/erros'
import Campo from '@/components/Campo'
import CabecalhoBranco from '@/components/CabecalhoBranco'

const igual = (a, b) =>
  a.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ===
  b.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// "Onde eu atendo": bairros atendidos e o texto de apresentação
export default function FormBairros() {
  const [carregando, setCarregando] = useState(true)
  const [userId, setUserId] = useState(null)
  const [meuBairro, setMeuBairro] = useState('')
  const [bairros, setBairros] = useState([])
  const [apresentacao, setApresentacao] = useState('')
  const [cep, setCep] = useState('')
  const [nomeBairro, setNomeBairro] = useState('')
  const [status, setStatus] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const supabase = criarClienteNavegador()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user.id)
      const [{ data: prof }, { data: perfil }] = await Promise.all([
        supabase.from('profissionais').select('apresentacao, bairros_atendidos').eq('id', user.id).single(),
        supabase.from('perfis').select('bairro').eq('id', user.id).single(),
      ])
      setBairros(prof?.bairros_atendidos ?? [])
      setApresentacao(prof?.apresentacao ?? '')
      setMeuBairro(perfil?.bairro ?? '')
      setCarregando(false)
    }
    carregar()
  }, [])

  function adicionar(nome) {
    const limpo = (nome || '').trim()
    if (!limpo) return
    setSalvo(false)
    if (bairros.some((b) => igual(b, limpo))) {
      setStatus(`${limpo} já está na sua lista.`)
      return
    }
    setBairros((atual) => [...atual, limpo])
    setStatus(`${limpo} adicionado. Não esqueça de salvar.`)
  }

  function remover(nome) {
    setSalvo(false)
    setBairros((atual) => atual.filter((b) => b !== nome))
    setStatus(`${nome} removido. Não esqueça de salvar.`)
  }

  // Adicionar pelo CEP: o nome do bairro fica igual ao que os clientes
  // recebem ao preencher o endereço, então a busca encontra certinho
  async function aoMudarCep(e) {
    const valor = formatarCep(e.target.value)
    setCep(valor)
    if (soDigitos(valor).length !== 8) return
    setStatus('Procurando o bairro...')
    const endereco = await buscarCep(valor)
    if (endereco?.bairro) {
      adicionar(endereco.bairro)
      setCep('')
    } else {
      setStatus('Não achamos o bairro desse CEP. Digite o nome no campo de baixo.')
    }
  }

  async function salvar() {
    setMensagem('')
    setSalvando(true)
    const supabase = criarClienteNavegador()
    const { error } = await supabase.from('profissionais')
      .update({ bairros_atendidos: bairros, apresentacao: apresentacao.trim() || null })
      .eq('id', userId)
    setSalvando(false)
    if (error) return setMensagem(traduzirErro(error))
    setSalvo(true)
    setStatus('')
    window.scrollTo(0, 0)
  }

  if (carregando) return <p className="pagina-branca carregando" role="status">Carregando...</p>

  const meuBairroFalta = meuBairro && !bairros.some((b) => igual(b, meuBairro))

  return (
    <div className="pagina-branca formulario">
      <CabecalhoBranco titulo="Onde eu atendo" voltar="/conta" rotuloVoltar="Voltar para o início" />

      {salvo && <div className="aviso sucesso" role="status"><p><strong>Salvo.</strong></p></div>}
      {mensagem && <div className="aviso erro" role="alert"><p>{mensagem}</p></div>}

      <section className="grupo" aria-labelledby="titulo-bairros">
        <h2 id="titulo-bairros">Bairros onde você atende</h2>
        <p className="fraco">Famílias desses bairros veem você primeiro na busca.</p>

        {bairros.length === 0 ? (
          <div className="vazio"><p>Nenhum bairro ainda. Sem bairros, você não aparece na busca.</p></div>
        ) : (
          <ul className="lista-bairros">
            {bairros.map((b) => (
              <li key={b}>
                <span>{b}</span>
                <button type="button" onClick={() => remover(b)} aria-label={`Remover ${b}`}>
                  <X size={20} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {meuBairroFalta && (
          <button type="button" className="botao secundario largo" onClick={() => adicionar(meuBairro)}>
            <Plus size={20} aria-hidden="true" /> Adicionar o meu bairro ({meuBairro})
          </button>
        )}

        <h3 className="subtitulo-bairro">Adicionar outro bairro</h3>
        <Campo
          id="cep-bairro"
          rotulo="Pelo CEP"
          ajuda="Digite um CEP do bairro. É o jeito mais certo."
          inputMode="numeric"
          value={cep}
          onChange={aoMudarCep}
          style={{ maxWidth: '12rem' }}
        />
        <div className="campo">
          <label htmlFor="nome-bairro">Ou pelo nome</label>
          <div className="senha">
            <input
              id="nome-bairro" type="text" value={nomeBairro}
              onChange={(e) => setNomeBairro(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionar(nomeBairro); setNomeBairro('') } }}
            />
            <button type="button" className="botao secundario" onClick={() => { adicionar(nomeBairro); setNomeBairro('') }}>
              Adicionar
            </button>
          </div>
        </div>
        <p className="status-cep" role="status" aria-live="polite">{status}</p>
      </section>

      <section className="grupo" aria-labelledby="titulo-sobre">
        <h2 id="titulo-sobre">Sobre você</h2>
        <Campo
          id="apresentacao"
          rotulo="Apresentação"
          opcional
          ajuda="Aparece para as famílias. Ex.: Manicure há 10 anos, atendo com paciência e todo o material esterilizado."
          multilinha
          rows={4}
          maxLength={500}
          value={apresentacao}
          onChange={(e) => { setSalvo(false); setApresentacao(e.target.value) }}
        />
      </section>

      <button type="button" className="botao largo" onClick={salvar} disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
