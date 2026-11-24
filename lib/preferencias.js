// Preferências de acessibilidade: tamanho da letra, alto contraste e
// leitura dos botões em voz alta.
// Ficam guardadas no navegador e, para quem tem login, também no perfil.

const CHAVE = 'vam-preferencias'

export const TAMANHOS = [
  { valor: 1, nome: 'Normal' },
  { valor: 2, nome: 'Grande' },
  { valor: 3, nome: 'Muito grande' },
]

const PADRAO = { tamanho: 2, contraste: false, voz: false }

export function lerPreferencias() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null')
    if (salvo) return { ...PADRAO, ...salvo, contraste: !!salvo.contraste, voz: !!salvo.voz }
  } catch {}
  return { ...PADRAO }
}

export function aplicarPreferencias(parciais) {
  const prefs = { ...lerPreferencias(), ...parciais }
  const html = document.documentElement
  html.dataset.fs = String(prefs.tamanho)
  html.dataset.contraste = prefs.contraste ? 'alto' : 'normal'
  try {
    localStorage.setItem(CHAVE, JSON.stringify(prefs))
  } catch {}
  window.dispatchEvent(new CustomEvent('preferencias-mudaram', { detail: prefs }))
  return prefs
}

// Converte entre o formato da tela e as colunas do perfil no banco
export const prefsDoPerfil = (p) => ({
  tamanho: p.tamanho_fonte, contraste: p.alto_contraste, voz: !!p.ler_em_voz_alta,
})
export const prefsParaPerfil = (p) => ({
  tamanho_fonte: p.tamanho, alto_contraste: p.contraste, ler_em_voz_alta: p.voz,
})

// Script que roda antes da página aparecer, para não "piscar" com a letra errada
export const scriptPreferencias = `
try {
  var p = JSON.parse(localStorage.getItem('${CHAVE}') || 'null');
  if (p) {
    document.documentElement.dataset.fs = String(p.tamanho || 2);
    document.documentElement.dataset.contraste = p.contraste ? 'alto' : 'normal';
  }
} catch (e) {}
`
