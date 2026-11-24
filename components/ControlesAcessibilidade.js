'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { criarClienteNavegador } from '@/lib/supabase/client'
import { TAMANHOS, aplicarPreferencias, lerPreferencias, prefsParaPerfil } from '@/lib/preferencias'
import { falar, pararDeFalar, temVozEmPortugues, vozDisponivel } from '@/lib/voz'

// Opções de leitura: tamanho da letra, alto contraste e voz.
// Para quem tem login, a escolha também fica salva no perfil.
export default function ControlesAcessibilidade() {
  const [prefs, setPrefs] = useState({ tamanho: 2, contraste: false, voz: false })
  const [semVoz, setSemVoz] = useState(false)

  useEffect(() => {
    setPrefs(lerPreferencias())
    const ouvir = (e) => setPrefs(e.detail)
    window.addEventListener('preferencias-mudaram', ouvir)

    // As vozes do aparelho às vezes demoram um pouco para carregar
    const checar = () => setSemVoz(!vozDisponivel() || !temVozEmPortugues())
    checar()
    if (vozDisponivel()) window.speechSynthesis.addEventListener?.('voiceschanged', checar)

    return () => {
      window.removeEventListener('preferencias-mudaram', ouvir)
      if (vozDisponivel()) window.speechSynthesis.removeEventListener?.('voiceschanged', checar)
    }
  }, [])

  async function mudar(parciais) {
    const novas = aplicarPreferencias(parciais)
    setPrefs(novas)
    const supabase = criarClienteNavegador()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('perfis').update(prefsParaPerfil(novas)).eq('id', user.id)
  }

  function alternarVoz() {
    const ligar = !prefs.voz
    mudar({ voz: ligar })
    if (ligar) falar('Leitura em voz alta ligada. Ao tocar em um botão ou numa caixa de texto, eu leio o que está escrito nele.')
    else pararDeFalar()
  }

  return (
    <div className="acessibilidade">
      <p className="acess-titulo" id="titulo-letra">Tamanho da letra</p>
      <div role="group" aria-labelledby="titulo-letra" className="tamanhos">
        {TAMANHOS.map((t) => (
          <button
            key={t.valor}
            type="button"
            className={`tamanho-${t.valor}`}
            aria-pressed={prefs.tamanho === t.valor}
            onClick={() => mudar({ tamanho: t.valor })}
          >
            <span aria-hidden="true">A</span>
            <span className="tamanho-nome">{t.nome}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="contraste"
        aria-pressed={prefs.contraste}
        onClick={() => mudar({ contraste: !prefs.contraste })}
      >
        Alto contraste {prefs.contraste ? 'ligado' : 'desligado'}
      </button>

      {/* data-sem-voz: este botão fala a própria mensagem, não o rótulo */}
      <button
        type="button"
        className="contraste botao-voz"
        aria-pressed={prefs.voz}
        onClick={alternarVoz}
        data-sem-voz
      >
        {prefs.voz ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
        Leitura em voz alta: {prefs.voz ? 'ligada' : 'desligada'}
      </button>
      {semVoz && (
        <p className="ajuda aviso-voz">
          Este aparelho pode não ter voz em português. Se não ouvir nada, confira o volume
          ou as configurações de voz do celular.
        </p>
      )}
    </div>
  )
}
