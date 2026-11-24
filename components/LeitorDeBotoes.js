'use client'

import { useEffect } from 'react'
import { lerPreferencias } from '@/lib/preferencias'
import { falar, textoDoCampo, textoParaLer } from '@/lib/voz'

// O que conta como "botão" para a leitura em voz alta:
// botões, links e os cartões de escolha (que são rótulos de opções)
const CLICAVEIS = 'button, a[href], [role="button"], label.opcao-conta, label.opcao'

// Caixas de texto que devem ser lidas ao serem tocadas
// (caixinhas de marcar e opções redondas já são lidas pelo clique no cartão)
const CAMPOS = 'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), textarea, select'

// Fica ouvindo o site inteiro. Quando a opção de leitura em voz alta
// está ligada:
//  - ao tocar num botão ou link, lê o texto dele
//  - ao tocar numa caixa de texto, lê o que deve ser preenchido
//  - quando aparece a lista de erros do formulário, lê os erros
export default function LeitorDeBotoes() {
  useEffect(() => {
    let ligado = lerPreferencias().voz
    let ultimo = { texto: '', quando: 0 }
    const atualizar = (e) => { ligado = !!e.detail?.voz }

    function dizer(texto) {
      if (!texto) return
      // Um toque pode gerar dois eventos seguidos com o mesmo texto:
      // ignora a repetição para não começar a frase duas vezes
      const agora = Date.now()
      if (texto === ultimo.texto && agora - ultimo.quando < 400) return
      ultimo = { texto, quando: agora }
      falar(texto)
    }

    function aoClicar(evento) {
      if (!ligado) return
      const el = evento.target.closest?.(CLICAVEIS)
      if (!el || el.dataset.semVoz !== undefined) return
      dizer(textoParaLer(el))
    }

    function aoFocar(evento) {
      if (!ligado) return
      const el = evento.target
      if (el.matches?.(CAMPOS)) {
        dizer(textoDoCampo(el))
      } else if (el.matches?.('[role="alert"]')) {
        // Resumo de erros que recebe o foco ao enviar o formulário
        dizer(textoParaLer(el))
      }
    }

    window.addEventListener('preferencias-mudaram', atualizar)
    document.addEventListener('click', aoClicar, true)
    document.addEventListener('focusin', aoFocar)
    return () => {
      window.removeEventListener('preferencias-mudaram', atualizar)
      document.removeEventListener('click', aoClicar, true)
      document.removeEventListener('focusin', aoFocar)
    }
  }, [])

  return null
}
