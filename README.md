# Carousel AI

Aplicação web para analisar conteúdos e criar carrosséis inteligentes para Instagram, aplicar a
identidade visual do usuário, editar visualmente os slides e exportar tudo pronto para publicação.

Interface em português do Brasil (arquitetura preparada para outros idiomas via
`NEXT_PUBLIC_DEFAULT_LOCALE`).

## Stack técnica

- **Next.js 16 (App Router)** + **TypeScript** (modo `strict`)
- **Tailwind CSS v4** + **shadcn/ui** (componentes escritos localmente — o registry
  `ui.shadcn.com` não é acessível a partir deste ambiente de desenvolvimento, então os componentes
  em `src/components/ui` foram implementados manualmente a partir dos primitivos Radix, sem alterar
  a API pública dos componentes gerados pelo CLI)
- **Supabase**: Postgres, Auth (e-mail/senha) e Storage, com Row Level Security em todas as tabelas
- **Konva / react-konva** para o editor visual e a exportação de slides
- **Zustand** para o estado do editor
- **React Hook Form + Zod** para formulários e validação
- **JSZip** e **pdf-lib** para exportação em ZIP/PDF
- **Sonner** para notificações
- **Vitest** (testes unitários) e **Playwright** (testes E2E essenciais)
- Camada `AIProvider` (`src/lib/ai`) com um `AnthropicProvider` e um `DemoProvider`
  determinístico — a aplicação nunca fica bloqueada sem uma chave de IA

## Instalação

```bash
npm install
cp .env.example .env.local
```

Preencha o `.env.local` conforme as seções abaixo.

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie a **Project URL**, a **anon public key** e a **service_role key** (Settings → API) para
   `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   A `service_role key` **nunca** é usada no navegador — apenas em `src/lib/supabase/admin.ts`,
   protegido pelo pacote `server-only`.
3. Aplique as migrations em `supabase/migrations/` (ordem numérica) no seu projeto:
   - Via [Supabase CLI](https://supabase.com/docs/guides/cli): `supabase link` e depois
     `supabase db push`; ou
   - Colando o conteúdo de cada arquivo, em ordem, no **SQL Editor** do painel do Supabase.
4. As migrations já criam:
   - Tabelas `profiles`, `brand_kits`, `projects`, `content_sources`, `carousels`, `slides`,
     `assets`, `exports`, `ai_generations`, todas com `user_id`, RLS habilitado e políticas
     `select/insert/update/delete` restritas a `auth.uid() = user_id`.
   - Um trigger que cria automaticamente uma linha em `profiles` a cada novo cadastro
     (`handle_new_user`).
   - Dois buckets de Storage: `brand-assets` (leitura pública, escrita restrita ao dono via
     `storage.foldername(name)[1] = auth.uid()`) e `exports` (totalmente privado).

### Validando as políticas de RLS

Depois de aplicar as migrations, é possível confirmar o isolamento entre usuários assim:

1. Crie dois usuários de teste (ex. `a@teste.com` e `b@teste.com`).
2. Autenticado como `a`, crie um kit de marca e um projeto.
3. No **SQL Editor** do Supabase, execute como o usuário `b`
   (`select set_config('request.jwt.claims', '{"sub":"<uuid-do-b>"}', true);` seguido de
   `select * from brand_kits;`) e confirme que as linhas do usuário `a` não aparecem.
4. Alternativamente, use o painel **Authentication → Policies** do Supabase, que lista e permite
   testar cada política diretamente na interface.
5. Tente uma query direta contra `storage.objects` de um bucket do usuário `a` autenticado como
   `b` — deve retornar vazio para `brand-assets` fora do próprio prefixo e para qualquer leitura em
   `exports`.

## Configurando a IA (Anthropic)

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
```

- Se `ANTHROPIC_API_KEY` **não** estiver definida, a aplicação entra automaticamente em **modo
  demonstração**: toda a geração de carrossel usa um `DemoProvider` determinístico (sem nenhuma
  chamada externa), permitindo testar o fluxo completo — wizard, editor, exportação — sem custo e
  sem internet. Um aviso “Modo demonstração ativo” aparece no topo do dashboard.
- A chave de IA só é lida em `src/lib/ai/anthropic-provider.ts`, no servidor. Nenhuma rota client
  side tem acesso a ela.

## Configurando geração de imagem (Google Gemini, opcional)

```
GEMINI_API_KEY=...
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
```

- Usada apenas pelo template **"Fotográfico com sobreposição"** para gerar uma imagem de fundo
  original por slide (com prompt construído a partir do gancho, sugestão visual e nicho, sempre
  instruindo a IA a não desenhar texto na imagem — o texto é sempre desenhado pela aplicação por
  cima). Sem essa chave, o template continua funcionando normalmente com um fundo escuro sólido; a
  opção "Gerar imagens de fundo com IA" simplesmente fica desabilitada no wizard.
- Crie a chave em [aistudio.google.com](https://aistudio.google.com/apikey).
- Assim como a chave da Anthropic, é lida apenas no servidor (`src/lib/ai/image/google-image-provider.ts`).

## Executando localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Testes

```bash
npm run test        # Vitest (unitários)
npm run test:watch  # Vitest em modo watch
npm run test:e2e    # Playwright (constrói e sobe a app automaticamente)
```

Os testes unitários cobrem, entre outros:

- Bloqueio de SSRF (IPs privados, loopback, link-local, metadados de nuvem, protocolos não-HTTP)
- Proteção contra open-redirect nos parâmetros `next` de login/callback
- Reparo e validação de JSON de respostas de IA contra os schemas Zod
- O `DemoProvider` (modo demonstração) validado contra os mesmos schemas usados pelo
  `AnthropicProvider`
- Layout de texto, ajuste automático de fonte e detecção de overflow
- Construção e reconstrução de slides a partir de templates
- Reordenar, duplicar, excluir e desfazer/refazer no estado do editor

Os testes Playwright cobrem as rotas que funcionam sem um projeto Supabase real conectado
(landing page, login, cadastro, e o comportamento de rotas protegidas). **Fluxo essencial para
expandir os testes E2E**: com `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` apontando
para um projeto real, adicione um teste que crie conta → configure um kit de marca → gere um
carrossel em modo demonstração pelo wizard → edite um slide → exporte o ZIP. A estrutura de dados
(`data-testid` não é necessária; os componentes já usam labels/roles acessíveis) já suporta esse
fluxo ponta a ponta.

## Deploy

O projeto está pronto para deploy (não foi implantado automaticamente por esta sessão):

1. **Vercel** (recomendado para Next.js): conecte o repositório, configure as mesmas variáveis de
   `.env.example` no painel do projeto (Environment Variables) e faça o deploy. Nenhuma
   configuração adicional de build é necessária (`next build` já é o comando padrão da Vercel).
2. **Supabase**: use o mesmo projeto criado na seção acima, ou um projeto de produção separado —
   nesse caso, repita a aplicação das migrations.
3. Após o primeiro deploy, confirme:
   - As variáveis `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` batem com o projeto
     de produção.
   - `SUPABASE_SERVICE_ROLE_KEY` e `ANTHROPIC_API_KEY` estão marcadas como variáveis apenas de
     servidor (nunca prefixadas com `NEXT_PUBLIC_`).
   - O redirect de autenticação por e-mail do Supabase (Authentication → URL Configuration)
     aponta para `https://SEU_DOMINIO/auth/callback`.

## O que foi implementado

- Autenticação (cadastro/login por e-mail e senha) e dashboard protegido por sessão de servidor
- CRUD completo de kits de marca (cores, fontes, logotipo, foto, estilo de botão, arredondamento,
  rodapé, CTA padrão, site/arroba), 7 presets visuais, upload de assets e "aplicar em todos os
  slides" (recolore/refonte os slides já publicados com aquele kit)
- Wizard de criação em 4 etapas: origem do conteúdo (URL/texto/tema) com extração segura e edição
  do texto extraído; estratégia (público, objetivo, tom, nível de consciência, CTA, quantidade de
  slides, intensidade criativa); estrutura (tese, ângulo, promessa, 3 ganchos, esboço dos slides,
  CTA sugerida); modelo visual (kit de marca, template, formato 1080×1350/1080×1080)
- Extração de conteúdo de URL protegida contra SSRF (bloqueio de IP privado/loopback/link-local/
  metadados de nuvem, DNS pinning contra rebinding, limite de redirecionamentos/tamanho/tempo),
  sanitização de HTML e extração via Readability
- Camada `AIProvider` com `AnthropicProvider` e `DemoProvider`; todas as respostas de IA são
  validadas com Zod, com uma tentativa de reparo controlada antes de reportar erro ao usuário
- Quatro templates de slide (minimalista, editorial, post social inspirado em rede social — sem
  métricas falsas e sem copiar a interface de nenhuma plataforma —, e fotográfico com sobreposição),
  com identidade de marca aplicada automaticamente
- Geração opcional de imagem de fundo por IA (Google Gemini) para o template fotográfico, com
  upload automático para o Storage e fallback gracioso (fundo escuro sólido) quando a chave não
  está configurada
- Editor visual completo (Konva + Zustand): selecionar/mover/redimensionar/rotacionar elementos,
  edição de texto inline, adicionar texto/forma/imagem/foto de perfil/logotipo, substituir imagem,
  camadas (ordem, bloqueio, visibilidade), guia de margem segura, desfazer/refazer, copiar/colar,
  atalhos de teclado, zoom, visualização em celular, autosave com indicador de alterações
- Prevenção de overflow: ajuste automático de tamanho de fonte dentro de limites, alerta visual, e
  ações de IA por slide (encurtar, mais forte, mais didático, mais provocativo, corrigir português,
  outra versão, dividir em dois slides, resumir em uma frase, novo título, regenerar) com
  pré-visualização antes de substituir
- Exportação: PNG por slide, ZIP com todos os slides nomeados em ordem (`slide-01.png`, ...), PDF
  opcional, três níveis de qualidade, tela de revisão (overflow, slides vazios, imagens em baixa
  resolução) e registro de cada exportação
- Legenda gerada por IA (abertura, desenvolvimento, CTA, hashtags, texto alternativo, comentário
  fixado sugerido, 3 opções de título) com botão de copiar por campo
- Pontuação editorial estimada (0–100) em 10 critérios, recalculável, com recomendações — sempre
  identificada como estimativa, nunca como garantia
- Modo demonstração completo (sem exigir `ANTHROPIC_API_KEY`) cobrindo todo o fluxo de criação até
  a exportação
- Migrations Postgres com RLS em todas as tabelas de usuário, rate limiting nas rotas de IA e de
  importação de URL, cabeçalhos de segurança básicos, proteção contra open-redirect e uploads
  validados por tipo/tamanho com nomes de arquivo gerados (nunca o nome original do usuário)

## Limitações conhecidas

- **Geração de imagem (Gemini) não testada em produção real por esta sessão**: o ambiente de
  desenvolvimento usado para construir a aplicação bloqueia acesso de rede direto a
  `generativelanguage.googleapis.com`, então o `GoogleImageProvider` foi implementado seguindo o
  formato documentado da API, mas não pôde ser exercitado ponta a ponta aqui. Teste após configurar
  `GEMINI_API_KEY`; se o nome do modelo (`GEMINI_IMAGE_MODEL`) mudar de nome no futuro, ajuste a
  variável de ambiente sem precisar mexer no código.
- **Rate limiting em memória**: `src/lib/security/rate-limit.ts` é por processo — adequado para uma
  instância única ou demonstração; em produção com múltiplas instâncias, substitua por um backend
  compartilhado (ex. Upstash Redis) — a interface já foi desenhada para essa troca ser um arquivo só.
- **Recorte de imagem no editor**: a substituição/reposicionamento de imagem funciona, mas o recorte
  fino (arrastar a área de recorte diretamente sobre a imagem) ainda usa os campos numéricos de
  largura/altura, não uma alça de recorte visual dedicada.
- **Guias inteligentes de alinhamento**: o canvas tem margem de segurança e snap básico; guias que
  reagem a todos os elementos vizinhos (estilo Figma) não foram implementadas.
- **Bucket `exports` sem uso ainda**: a migration cria um bucket privado com políticas de URL
  assinada prontas para armazenar arquivos exportados no servidor, mas a exportação atual acontece
  inteiramente no navegador (o ZIP/PDF é gerado e baixado direto do cliente) — o bucket fica
  disponível para uma futura opção de "exportar no servidor e compartilhar por link".
- **Testes E2E**: cobrem as rotas públicas e o comportamento de configuração ausente; o fluxo
  autenticado completo precisa de um projeto Supabase real (veja "Testes" acima).
- **Idiomas**: a arquitetura já isola textos de UI e prompts de IA por módulo, mas apenas o
  português do Brasil está implementado nesta versão.
