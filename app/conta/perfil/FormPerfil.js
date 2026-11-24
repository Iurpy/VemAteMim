'use client'

import { useEffect, useState } from 'react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import {
  enderecoEmBranco, enderecoParaBanco, enderecoParaTela, enderecoVazio,
  formatarTelefone, soDigitos, telefoneValido, validarEndereco,
} from '@/lib/formatos'
import { TAMANHOS, aplicarPreferencias } from '@/lib/preferencias'
import { falar } from '@/lib/voz'
import { traduzirErro } from '@/lib/erros'
import Campo from '@/components/Campo'
import CamposEndereco from '@/components/CamposEndereco'
import ResumoErros from '@/components/ResumoErros'

const CANAIS = [
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'ligacao', rotulo: 'Ligação' },
  { valor: 'sms', rotulo: 'Mensagem de texto (SMS)' },
  { valor: 'email', rotulo: 'E-mail' },
]

export default function FormPerfil() {
  const [carregando, setCarregando] = useState(true)
  const [userId, setUserId] = useState(null)
  const [tipo, setTipo] = useState('cliente')
  const [dados, setDados] = useState({ nome: '', telefone: '', canal_contato: 'whatsapp', tamanho_fonte: 2, alto_contraste: false, ler_em_voz_alta: false })
  const [endereco, setEndereco] = useState(enderecoVazio)
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // READ: carrega o perfil de quem está logado
  useEffect(() => {
    async function carregar() {
      const supabase = criarClienteNavegador()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data, error } = await supabase.from('perfis').select('*').eq('id', user.id).single()
      if (error) {
        setMensagem(traduzirErro(error))
      } else {
        setTipo(data.tipo)
        setDados({
          nome: data.nome,
          telefone: formatarTelefone(data.telefone || ''),
          canal_contato: data.canal_contato,
          tamanho_fonte: data.tamanho_fonte,
          alto_contraste: data.alto_contraste,
          ler_em_voz_alta: !!data.ler_em_voz_alta,
        })
        setEndereco(enderecoParaTela(data))
      }
      setCarregando(false)
    }
    carregar()
  }, [])

  const alterar = (campo, valor) => {
    setSalvo(false)
    setDados((atual) => ({ ...atual, [campo]: valor }))
  }
  const alterarEndereco = (campo, valor) => {
    setSalvo(false)
    setEndereco((atual) => ({ ...atual, [campo]: valor }))
  }

  function validar() {
    const e = {}
    if (dados.nome.trim().length < 2) e.nome = 'Digite seu nome.'
    if (!telefoneValido(dados.telefone)) e.telefone = 'Digite o telefone com DDD, por exemplo (85) 99999-9999.'
    // O endereço pode ficar em branco, mas se começar a preencher, precisa estar completo
    if (!enderecoEmBranco(endereco)) Object.assign(e, validarEndereco(endereco))
    return e
  }

  // UPDATE: salva o perfil
  async function salvar(evento) {
    evento.preventDefault()
    setMensagem('')
    setSalvo(false)
    const e = validar()
    setErros(e)
    if (Object.keys(e).length) return

    setSalvando(true)
    const supabase = criarClienteNavegador()
    const { error } = await supabase
      .from('perfis')
      .update({
        nome: dados.nome.trim(),
        telefone: soDigitos(dados.telefone),
        canal_contato: dados.canal_contato,
        tamanho_fonte: Number(dados.tamanho_fonte),
        alto_contraste: dados.alto_contraste,
        ler_em_voz_alta: dados.ler_em_voz_alta,
        ...enderecoParaBanco(endereco),
      })
      .eq('id', userId)
    setSalvando(false)

    if (error) {
      setMensagem(traduzirErro(error))
      return
    }
    aplicarPreferencias({ tamanho: Number(dados.tamanho_fonte), contraste: dados.alto_contraste, voz: dados.ler_em_voz_alta })
    setSalvo(true)
    window.scrollTo(0, 0)
  }

  if (carregando) return <p className="carregando" role="status">Carregando seu perfil...</p>

  return (
    <div className="formulario">
      {salvo && <div className="aviso sucesso" role="status"><p><strong>Perfil salvo.</strong></p></div>}
      <ResumoErros erros={erros} mensagem={mensagem} />

      <form onSubmit={salvar} noValidate>
        <fieldset className="grupo">
          <legend>Seus dados</legend>
          <Campo id="nome" rotulo="Nome" autoComplete="name" value={dados.nome} onChange={(e) => alterar('nome', e.target.value)} erro={erros.nome} />
          <Campo
            id="telefone" rotulo="Telefone com DDD" type="tel" inputMode="tel" autoComplete="tel"
            value={dados.telefone} onChange={(e) => alterar('telefone', formatarTelefone(e.target.value))} erro={erros.telefone}
          />
        </fieldset>

        <CamposEndereco
          titulo={tipo === 'profissional' ? 'Seu endereço (de onde você sai para atender)' : 'Seu endereço (para atendimentos para você)'}
          valores={endereco}
          alterar={alterarEndereco}
          erros={erros}
        />

        <fieldset className="grupo">
          <legend>Como prefere ser avisado</legend>
          {CANAIS.map((c) => (
            <label key={c.valor} className="opcao">
              <input type="radio" name="canal" value={c.valor} checked={dados.canal_contato === c.valor} onChange={() => alterar('canal_contato', c.valor)} />
              <span>{c.rotulo}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="grupo">
          <legend>Como prefere usar o site</legend>
          <p className="ajuda">Tamanho da letra</p>
          {TAMANHOS.map((t) => (
            <label key={t.valor} className="opcao">
              <input type="radio" name="tamanho" value={t.valor} checked={Number(dados.tamanho_fonte) === t.valor} onChange={() => alterar('tamanho_fonte', t.valor)} />
              <span style={{ fontSize: ['16px', '20px', '26px'][t.valor - 1] }}>{t.nome}</span>
            </label>
          ))}
          <label className="opcao" style={{ marginTop: '1rem' }}>
            <input type="checkbox" checked={dados.alto_contraste} onChange={(e) => alterar('alto_contraste', e.target.checked)} />
            <span>Alto contraste (fundo preto, letras brancas e amarelas)</span>
          </label>
          <label className="opcao">
            <input
              type="checkbox"
              checked={dados.ler_em_voz_alta}
              onChange={(e) => {
                alterar('ler_em_voz_alta', e.target.checked)
                if (e.target.checked) falar('Ao tocar em um botão ou numa caixa de texto, eu leio o que está escrito nele.')
              }}
            />
            <span>Leitura em voz alta (ao tocar em um botão ou numa caixa de texto, o site lê o que está escrito nele)</span>
          </label>
        </fieldset>

        <div className="acoes">
          <button type="submit" className="botao largo" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </form>
    </div>
  )
}
