# Vem Até Mim

Site da startup Vem Até Mim (IFCE Campus Maracanaú), feito com Next.js e Supabase.

## O que já funciona (Etapa 3)

- Cadastro com a escolha **"Quero contratar um serviço"** ou **"Quero oferecer meus serviços"**
- Entrar e sair
- **Meu perfil**: dados pessoais, endereço (preenchido pelo CEP) e preferências de acessibilidade
- **Minha família**: cadastrar, listar, editar e excluir familiares (CRUD completo)
- Botões de **tamanho da letra** e **alto contraste** em todas as páginas

## Como rodar no seu computador

1. Instale o **Node.js 20.9 ou mais novo** (https://nodejs.org).
2. Na pasta do projeto, rode:
   ```
   npm install
   ```
3. Copie o arquivo `.env.local.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase > Project Settings > API > Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: na mesma tela, a chave **anon** (ou **publishable**).
     Nunca use a chave `service_role` aqui.
4. Rode:
   ```
   npm run dev
   ```
5. Abra http://localhost:3000

## Configuração do Supabase

O banco precisa estar criado com `v2_01_modelo.sql` e `v2_02_seguranca.sql`.

Em **Authentication**:

- **Para testar mais rápido**: em *Sign In / Providers > Email*, desligue **Confirm email**.
  Assim a conta já entra logada depois do cadastro. Antes de apresentar, ligue de novo.
- Em *URL Configuration*, coloque `http://localhost:3000` em **Site URL**
  (depois, troque pelo endereço do site publicado).

Para virar admin (equipe), cadastre-se normalmente e rode no SQL Editor:

```sql
update perfis set tipo = 'admin'
where id = (select id from auth.users where email = 'seu@email.com');
```

## Organização das pastas

```
app/                     páginas (cada pasta é um endereço do site)
  page.js                página inicial
  cadastro/              criar conta
  entrar/                login
  conta/                 área logada (protegida)
    perfil/              meu perfil (READ e UPDATE)
    familia/             minha família (CREATE, READ, UPDATE, DELETE)
components/              pedaços reutilizáveis (campos, endereço, cabeçalho...)
lib/
  supabase/              conexão com o Supabase (navegador e servidor)
  formatos.js            CEP, telefone, validações
  erros.js               mensagens de erro em português
  preferencias.js        tamanho da letra e contraste
proxy.js                 protege /conta e renova o login
```

## Roteiro de testes do CRUD

**Cadastro e login**
- [ ] Criar conta como "Quero contratar". Conferir em Table Editor > `perfis` que o tipo ficou `cliente`.
- [ ] Criar outra conta como "Quero oferecer". Conferir `tipo = profissional` e uma linha nova em `profissionais`.
- [ ] Tentar cadastrar com o mesmo e-mail: deve aparecer "Já existe uma conta com esse e-mail".
- [ ] Sair e tentar abrir http://localhost:3000/conta: deve mandar para "Entrar".
- [ ] Entrar com senha errada: mensagem em português.

**Perfil**
- [ ] Digitar um CEP de Maracanaú (ex.: 61900-000): rua, bairro, cidade e estado aparecem sozinhos.
- [ ] Salvar sem número: o erro aparece no topo e ao lado do campo.
- [ ] Mudar a letra para "Muito grande", salvar, sair e entrar de novo: a letra continua grande.

**Família**
- [ ] Cadastrar sem marcar a confirmação: deve pedir para marcar.
- [ ] Cadastrar a avó: aparece na lista com o aviso "Familiar cadastrado".
- [ ] Editar o bairro dela e salvar.
- [ ] Excluir: aparece a confirmação; "Não, manter" cancela; "Sim, excluir" apaga.
- [ ] Entrar com a outra conta: a família da primeira **não** aparece.

**Acessibilidade**
- [ ] Navegar só com a tecla Tab: o contorno amarelo mostra onde você está.
- [ ] Testar o alto contraste e a letra "Muito grande" no celular.
- [ ] Dar zoom no celular com dois dedos: precisa funcionar.

## Roteiro de testes da área da profissional

Crie uma conta escolhendo **"Sou profissional"**.

- [ ] O início mostra "Complete seu cadastro" com 4 passos e "Você ainda não aparece na busca".
- [ ] **Perfil**: preencha o endereço pelo CEP. O passo "Seu endereço" fica marcado.
- [ ] **Onde eu atendo**: adicione um bairro pelo CEP e outro pelo nome, remova um, salve.
- [ ] **Serviços**: adicione "Manicure" com preço 60,00. Confira "O cliente paga R$ 63,00" e "Você recebe R$ 51,00".
- [ ] Adicione "Outro serviço" sem nome: deve pedir o nome e a descrição. Com eles, fica "Esperando revisão da equipe".
- [ ] Pause a manicure e volte a oferecer. Edite o preço. Exclua o "Outro serviço".
- [ ] **Horários**: adicione segunda e quarta das 08:00 às 12:00. Tente adicionar segunda das 10:00 às 14:00: deve avisar que bate com outro horário.
- [ ] Adicione uma folga de um dia inteiro e outra de só uma parte do dia. Exclua uma.
- [ ] Com bairro e serviço salvos, o início diz "Você já aparece na busca".
- [ ] Entre com uma conta de **cliente** de um desses bairros e procure em **Buscar**: a profissional aparece no topo, com "atende o seu bairro".
- [ ] Para aprovar um "Outro serviço" (equipe), no SQL Editor:
  ```sql
  update profissional_servicos set situacao = 'aprovado', revisado_em = now()
  where servico_id = (select id from servicos where nome = 'Outro serviço');
  ```
