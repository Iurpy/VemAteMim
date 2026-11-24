// Leitura em voz alta usando a voz do próprio aparelho (Web Speech API).
// Não precisa de internet nem de serviço pago.

export const vozDisponivel = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function escolherVoz() {
  const vozes = window.speechSynthesis.getVoices()
  return (
    vozes.find((v) => v.lang === 'pt-BR') ||
    vozes.find((v) => v.lang?.toLowerCase().startsWith('pt')) ||
    null
  )
}

export function temVozEmPortugues() {
  if (!vozDisponivel()) return false
  return !!escolherVoz()
}

export function falar(texto) {
  if (!vozDisponivel() || !texto) return
  const synth = window.speechSynthesis
  synth.cancel() // para o que estava sendo lido antes
  const fala = new SpeechSynthesisUtterance(texto)
  fala.lang = 'pt-BR'
  fala.rate = 0.95 // um pouco mais devagar que o normal
  const voz = escolherVoz()
  if (voz) fala.voice = voz
  synth.speak(fala)
}

export function pararDeFalar() {
  if (vozDisponivel()) window.speechSynthesis.cancel()
}

// Texto que deve ser lido para um elemento clicado:
// o aria-label, se tiver; senão, o texto que aparece nele.
export function textoParaLer(el) {
  const rotulo = el.getAttribute('aria-label')
  const texto = rotulo || el.innerText || el.textContent || ''
  return texto.replace(/\s+/g, ' ').trim()
}

// Texto que deve ser lido quando a pessoa toca numa caixa de texto:
// o nome do campo, a explicação embaixo dele, o erro (se tiver)
// e o que já está escrito (menos a senha, que nunca é lida).
export function textoDoCampo(el) {
  // tira espaços extras e o ponto final, porque as partes são juntadas com '. '
  const limpar = (t) => (t || '').replace(/\s+/g, ' ').trim().replace(/[.:;]+$/, '')
  const partes = []

  const rotulo = el.labels?.[0]?.innerText || el.getAttribute('aria-label') || el.placeholder
  if (rotulo) partes.push(limpar(rotulo))

  // Ajuda e erro ligados ao campo por aria-describedby
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean)
  for (const id of ids) {
    const t = limpar(document.getElementById(id)?.innerText)
    if (t) partes.push(t)
  }

  if (el.tagName === 'SELECT') {
    const escolhido = el.options[el.selectedIndex]?.text
    if (escolhido) partes.push(`Escolhido: ${escolhido}`)
  } else if (el.type === 'password') {
    partes.push(el.value ? 'A senha já foi digitada' : 'Digite aqui')
  } else {
    partes.push(el.value ? `Já está escrito: ${el.value}` : 'Digite aqui')
  }

  return partes.join('. ')
}
