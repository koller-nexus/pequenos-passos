# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A criança que cumpre a rotina diária (marca as tarefas no celular) e o pai/mãe que acompanha e orienta (usam juntos; o adulto também consulta o relatório dos últimos sete dias). Uso principal em celular, mobile-first.

## Product Purpose

PWA que organiza e acompanha a rotina diária e semanal da criança: uma lista de tarefas por dia da semana (rotinas diferentes para seg/qua, ter/qui/sex e fim de semana), mais um conjunto de compromissos obrigatórios. Sucesso = a criança consegue cumprir o dia com autonomia e os pais enxergam o andamento da semana de relance.

## Positioning

Rotina viva e específica desta família — tarefas reais da casa (louça, lixo, gatos, futebol) organizadas por dia da semana, com histórico local e relatório para os pais. Sem conta, sem servidor, sem nuvem.

## Operating Context

- Uso no dia a dia em casa: manhã, pós-escola, jantar e antes de deitar.
- O adulto usa o relatório impresso/salvo em PDF para guardar uma cópia.
- Instalada como app no celular (service worker, manifest, offline funcional).

## Capabilities and Constraints

- Rotinas por dia da semana + tarefas obrigatórias; marcar/desmarcar com estado por dia.
- Histórico local de 7 dias; página de relatório para os pais (`/familia`), não indexada.
- **Dados somente neste dispositivo (localStorage). Sem conta, sem servidor, sem nuvem — restrição permanente.**
- Sem backend; tudo roda no cliente com persistência local.
- Fatos ainda não decididos: (nenhum aberto no momento).

## Brand Commitments

- Nome: **Pequenos Passos**; interface em português do Brasil (`pt-BR`).
- Linguagem informal e infantil, já usada nas tarefas ("ir pra escola", "arrumar a cama").

## Evidence on Hand

- Código-fonte completo em `src/` (rotinas reais da família em `src/data/routines.ts`).
- Sem depoimentos, métricas, preços ou conteúdo de marketing — não fabricar nenhum.

## Product Principles

1. Nenhum dado sai do dispositivo: privacidade da família acima de qualquer recurso.
2. Funciona offline; a rotina do dia nunca depende de rede.
3. Mobile-first: a criança usa com o polegar, em qualquer tela.
4. Autonomia da criança primeiro; o adulto observa sem atrapalhar o fluxo.
5. Conteúdo real da família, nunca placeholder genérico.
