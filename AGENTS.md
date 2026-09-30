# Pequenos Passos — site Next.js como PWA

Este repositório é destinado a um site moderno construído com Next.js e entregue como Progressive Web App (PWA). Todas as decisões de código, interface, desempenho e acessibilidade devem favorecer uma experiência rápida, instalável, resiliente e consistente em dispositivos móveis e desktop.

## Skills do projeto

As skills instaladas em `.agents/skills/**` fazem parte das instruções deste projeto. Antes de uma tarefa relevante, leia o `SKILL.md` correspondente e aplique suas orientações; se novas skills forem adicionadas nesse diretório, considere-as no planejamento sem exigir alteração manual neste arquivo.

- `.agents/skills/frontend-design/SKILL.md` — obrigatória ao criar ou reformular telas, componentes visuais, identidade, tipografia, layout, motion ou conteúdo de interface.
- `.agents/skills/vercel-react-best-practices/SKILL.md` — obrigatória ao escrever, revisar ou refatorar componentes React, rotas Next.js, busca de dados, Server Components, Client Components, cache ou bundle.
- `.agents/skills/grill-me/SKILL.md` — use antes de implementar mudanças ambíguas ou de alto impacto para interrogar requisitos, premissas, alternativas e critérios de sucesso.

Para regras detalhadas de React/Next.js, consulte também:

- `.agents/skills/vercel-react-best-practices/AGENTS.md` — guia completo compilado.
- `.agents/skills/vercel-react-best-practices/rules/*.md` — explicação e exemplos de cada regra.

Não copie, mova ou altere arquivos dentro de `.agents/skills/**` apenas para adaptar o projeto. Use as skills como fonte de orientação e mantenha o código do site no restante do repositório.

## Fluxo de trabalho

1. Entenda o objetivo do usuário, o público, o conteúdo real e os critérios de aceite.
2. Para planejamentos ou designs não triviais, use `grill-me` para reduzir ambiguidades antes de codificar.
3. Para qualquer mudança visual, siga o processo de `frontend-design`: fundamentar a direção no assunto, planejar, construir, criticar e refinar.
4. Antes de alterar código React/Next.js, consulte as regras relevantes de `vercel-react-best-practices`, priorizando waterfalls e tamanho de bundle.
5. Preserve comportamento existente, siga os padrões locais quando já houver código e mantenha cada alteração focada na necessidade solicitada.
6. Valide tipagem, lint, testes, build e experiência PWA usando os scripts existentes no `package.json`; não invente comandos quando ainda não houver configuração.

## Arquitetura Next.js

- Use Next.js App Router com TypeScript e React Server Components como padrão.
- Mantenha componentes no servidor sempre que não precisarem de interatividade, estado, efeitos ou APIs do navegador.
- Adicione `"use client"` somente no menor limite necessário; não converta rotas ou árvores inteiras para Client Components sem motivo.
- Mantenha busca de dados e transformações pesadas no servidor quando possível. Entregue ao cliente somente os campos necessários.
- Paralelize buscas independentes com `Promise.all` ou composição de componentes e elimine cadeias sequenciais de `await`.
- Não use estado compartilhado em nível de módulo para dados por requisição. Use `React.cache()` para deduplicação por requisição quando fizer sentido.
- Use `after()` para trabalho pós-resposta que não pode atrasar a renderização.
- Evite importar barrels, bibliotecas pesadas no carregamento inicial e dependências que possam ser carregadas sob demanda.
- Mantenha rotas de API e Server Actions autenticadas e autorizadas com a mesma rigorosidade de qualquer endpoint público.
- Trate estados de carregamento, erro, vazio, offline e atualização de dados de forma explícita.

## Contrato PWA

- O app deve ser instalável e identificado por um manifest válido em `public/manifest.webmanifest` ou por uma rota equivalente.
- O manifest deve declarar `name`, `short_name`, `start_url`, `scope`, `display`, `theme_color`, `background_color` e ícones adequados.
- Forneça ícones de pelo menos 192×192 e 512×512, além de um ícone maskable seguro para ícones do sistema.
- Declare o manifest e os ícones nos metadados do Next.js e mantenha `theme_color`, ícone e splash visualmente consistentes.
- Registre o service worker de forma idempotente e somente quando fizer sentido para o ambiente de execução.
- Versione as chaves de cache e tenha uma estratégia explícita para HTML, assets estáticos, imagens, fontes, APIs e navegação.
- Assets imutáveis devem usar cache longo com hashes; conteúdo navegável deve priorizar atualização segura.
- Não coloque respostas autenticadas, dados pessoais ou conteúdo estritamente por requisição em caches persistentes sem uma justificativa e validação de segurança.
- Ofereça uma página ou fallback offline útil, sem fingir que dados dinâmicos estão atualizados.
- Comunique atualizações disponíveis e evite recarregar a página durante uma interação crítica.
- Teste instalação, atualização, navegação offline, recarga, múltiplas abas e comportamento quando o service worker está desabilitado.

## Interface e conteúdo

- Trate o design como parte do produto: paleta, tipografia, escala, ritmo, imagens e composição devem refletir o assunto e o público do Pequenos Passos.
- Evite estética genérica de template, cards idênticos, gradientes decorativos, motion sem função e cópias placeholder.
- Use conteúdo real ou plausível durante a construção para validar hierarquia, densidade e leitura.
- Prefira HTML semântico, foco visível, contraste suficiente, alvos de toque confortáveis e navegação completa por teclado.
- Adote mobile-first, viewport fluido, `prefers-reduced-motion` e tamanhos de linha legíveis.
- Respeite `safe-area-inset-*`, zoom do navegador e mudanças de orientação.
- Não esconda conteúdo essencial atrás de animações ou dependências exclusivamente client-side.

## Desempenho e acessibilidade

- Elimine waterfalls antes de micro-otimizações e reduza JavaScript enviado ao cliente.
- Estabilize identidades usadas como dependências de hooks e evite renderizações causadas por objetos ou funções inline desnecessários.
- Prefira estado derivado calculado durante a renderização a sincronização por efeitos.
- Use `useTransition` ou `useDeferredValue` apenas quando realmente houver atualização não urgente.
- Otimize imagens com `next/image`, tamanhos responsivos, dimensões explícitas e formatos modernos quando suportados.
- Não adicione `useMemo`, `useCallback`, dynamic imports ou service workers sem medir ou justificar o benefício.
- Inclua métricas relevantes de Lighthouse/Core Web Vitals quando houver pipeline de performance.
- A validação deve cobrir acessibilidade e os fluxos principais em viewport móvel e desktop.

## Revisão final

Antes de considerar uma tarefa concluída:

- Confirme que a mudança atende ao pedido e aos critérios de aceite.
- Verifique tipagem, lint, testes e build disponíveis no projeto.
- Revise o diff em busca de complexidade, regressões, vazamento de segredos e dependências acidentais.
- Para telas, revise hierarquia, responsividade, foco, contraste, motion e estados interativos.
- Para PWA, verifique manifest, ícones, registro do service worker, estratégias de cache, atualização e fallback offline.
- Nunca afirme que testes passaram sem executá-los e conferir o resultado.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
