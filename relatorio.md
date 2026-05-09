# Relatorio Vivo - AnimeEngine v7

**Data:** Maio de 2026  
**Versao:** sitev7  
**Status:** Base oficial em evolucao, com foco em polimento, experiencia e confiabilidade  

---

## 1. Visao Geral

O AnimeEngine v7 deixou de ser apenas um catalogo de animes e passou a se comportar como um pequeno sistema pessoal para descobrir, organizar e acompanhar animes. A base atual ja tem uma identidade visual forte, navegacao multipagina, listas, calendario, exploracao, perfil, titulos, conquistas, estatisticas, player de OST, PWA e integracao com AniList.

O objetivo daqui para frente deve ser transformar a v7 em uma experiencia mais coesa: menos telas isoladas e mais sensacao de produto. O usuario deve abrir o site e entender rapidamente:

- o que assistir agora;
- o que esta no ar hoje;
- o que ele esta acompanhando;
- o que vale descobrir;
- quais conquistas/progresso ele desbloqueou;
- quais funcoes tornam o AnimeEngine diferente de um catalogo comum.

Este relatorio substitui a lista antiga de auditoria por um plano vivo de melhorias, ideias e prioridades.

---

## 2. Estado Atual da v7

### Pontos fortes

- Identidade visual marcante com estilo neo-brutalist.
- Estrutura PHP com includes reutilizaveis para header, nav e footer.
- Paginas principais ja separadas: Home, Explorar, Lista, Assistindo, Favoritos, Calendario, Calculadora, Estatisticas, Titulos, Perfil, Admin e Changelog.
- Integracao com AniList para dados de animes.
- Sistema local de listas, favoritos, progresso, conquistas, notificacoes e temas.
- Player de OST com integracao YouTube e fallback visual.
- Melhorias recentes de seguranca: CSRF, rate limit, logs, prepared statements, health check, cache e headers.
- Responsividade melhorada em Home, Calendario e Explorar.
- PWA iniciado com manifest e service worker.

### Pontos que ainda merecem cuidado

- Algumas telas ainda possuem estilos antigos conflitantes.
- Existem regras CSS repetidas e globais demais.
- Alguns componentes ainda dependem de `onclick` inline.
- A experiencia mobile esta melhor, mas ainda pode ficar mais fluida.
- Falta uma linguagem unica para estados de loading, erro e vazio.
- Algumas features existem, mas poderiam conversar mais entre si.
- Falta uma camada mais clara de testes e verificacao automatica.

---

## 3. Direcao de Produto

### Proposta central

AnimeEngine v7 deve ser um painel pessoal de anime com personalidade: rapido para consultar, divertido para explorar e recompensador para manter uma lista viva.

### Pilares da experiencia

1. **Descoberta**
   Explorar, aleatorio, OSTs, recomendacoes, animes em alta e calendario da temporada.

2. **Organizacao**
   Lista pessoal, assistindo, favoritos, concluidos, planejados e historico.

3. **Progresso**
   Episodios, streaks, conquistas, titulos, estatisticas e metas semanais.

4. **Personalidade**
   Temas, modo visual, player OST, frases, animacoes, roleta e microinteracoes.

5. **Confiabilidade**
   Seguranca, fallback de imagens, cache, logs, validacoes e boa performance.

---

## 4. Ideias de Features para Deixar a v7 Mais Legal

### 4.1 Central "Hoje no AnimeEngine"

Criar uma area na Home que responda rapidamente: "o que eu faco agora?"

Sugestoes:

- Proximo episodio da temporada.
- Anime que o usuario esta assistindo e parou mais perto do fim.
- Sugestao rapida de anime aleatorio com dado.
- Meta semanal ativa.
- Ultima conquista desbloqueada.
- Botao "Continuar assistindo".

Impacto esperado: a Home fica mais util e menos apenas vitrine.

Prioridade: alta.

---

### 4.2 Sistema de Missoes Semanais

Expandir as metas atuais para um sistema de missoes com recompensas.

Exemplos:

- Assistir 3 episodios.
- Adicionar 2 animes na lista.
- Favoritar 1 anime.
- Explorar um anime de genero diferente.
- Ouvir uma OST.
- Abrir o calendario 3 vezes na semana.

Recompensas:

- XP.
- Titulos.
- Badges.
- Temas secretos.
- Molduras de perfil.

Prioridade: alta.

---

### 4.3 Perfil Mais Vivo

O perfil pode virar uma pagina de identidade do usuario.

Ideias:

- Banner customizavel.
- Anime favorito em destaque.
- Titulo equipado.
- Badges raras.
- Top generos.
- Tempo estimado assistido.
- Ultimas conquistas.
- Linha do tempo de atividades.
- Compartilhamento de perfil.

Prioridade: alta.

---

### 4.4 Explorar 2.0

O Explorar ja melhorou, mas pode virar uma experiencia de descoberta mais forte.

Ideias:

- Presets mais inteligentes: "curtos", "classicos", "hidden gems", "romance leve", "acao boa", "para maratonar".
- Cards com razao da recomendacao: "alta nota", "curto", "em lancamento", "popular".
- Comparador rapido entre dois animes.
- Botao "nao quero ver isso" para esconder resultados temporariamente.
- Filtro por humor: leve, intenso, triste, engracado, epico.
- Secao "descoberta do dia".

Prioridade: alta.

---

### 4.5 Calendario da Temporada 2.0

O Calendario deve funcionar como uma agenda real.

Ideias:

- Aba "Hoje" como primeira experiencia no mobile.
- Cards com estado: no ar, em breve, ja exibido.
- Lembrete visual para animes que o usuario segue.
- Agrupamento por horario.
- Botao "adicionar todos os que sigo".
- Modo compacto e modo detalhado.
- Destaque do proximo episodio no topo.
- Integracao com notificacoes internas.

Prioridade: alta.

---

### 4.6 Roleta/Aleatorio Premium

O aleatorio agora varia melhor, mas pode virar uma feature propria.

Ideias:

- Tela de roleta com animacao de cartas.
- Filtros antes do sorteio: genero, formato, nota minima, episodios.
- Modo "surpreenda-me".
- Modo "da minha lista".
- Modo "anime curto".
- Historico dos ultimos sorteados.
- Botao "sortear de novo".

Prioridade: media-alta.

---

### 4.7 Radio OST Melhorada

O player de OST tem potencial de ser uma assinatura do site.

Ideias:

- Mini player persistente mais bonito.
- Lista de faixas recentes.
- Favoritar OST.
- Radio por anime/genero/clima.
- Estado "tocando agora" nos cards.
- Visualizer simples no player.
- Fallback automatico quando o video falhar.

Prioridade: media.

---

### 4.8 Sistema de Titulos e Badges Mais Profundo

Titulos podem ser mais do que uma lista.

Ideias:

- Titulos equipaveis.
- Raridade: comum, raro, epico, lendario.
- Badges por comportamento.
- Titulos secretos por easter eggs.
- Moldura de perfil vinculada ao titulo.
- Pagina de colecao com progresso.

Prioridade: media.

---

### 4.9 Estatisticas Mais Humanas

Estatisticas devem contar uma historia, nao apenas mostrar numeros.

Ideias:

- "Seu genero dominante e..."
- "Voce prefere animes curtos/longos."
- "Seu mes mais ativo."
- "Voce completou X% do que comecou."
- Graficos de progresso.
- Ranking dos animes melhor avaliados pelo usuario.
- Comparacao com a media geral da AniList.

Prioridade: media.

---

### 4.10 Changelog Integrado

A pagina de changelog criada pode evoluir para um recurso de transparencia do projeto.

Ideias:

- Separar por versao.
- Mostrar "novo", "melhorado", "corrigido".
- Mostrar screenshots pequenos de mudancas visuais.
- Botao "ver commits recentes".
- Filtro por categoria: UI, API, seguranca, performance, features.

Prioridade: baixa-media.

---

## 5. Melhorias de UI/UX

### 5.1 Design System da v7

O site precisa de uma camada clara de componentes para reduzir conflitos CSS.

Componentes recomendados:

- Botao primario.
- Botao secundario.
- Botao icone.
- Card padrao.
- Card de anime.
- Tag/chip.
- Toast.
- Modal.
- Empty state.
- Loading skeleton.
- Toolbar.
- Tabs.
- Segmented control.

Meta: parar de corrigir cada botao manualmente e fazer todos seguirem o mesmo sistema.

Prioridade: alta.

---

### 5.2 Estados Padronizados

Cada pagina deve ter estados previsiveis:

- carregando;
- vazio;
- erro;
- offline;
- sem login;
- sucesso;
- confirmacao.

Exemplo:

- Explorar sem resultado: sugerir limpar filtros.
- Calendario sem animes: sugerir outra temporada.
- Lista vazia: sugerir explorar ou sortear.

Prioridade: alta.

---

### 5.3 Mobile First Real

O mobile ja esta melhor, mas a v7 deve tratar celular como experiencia principal.

Melhorias:

- Filtros em bottom sheet.
- Tabs horizontais sem barra grossa.
- Cards compactos.
- Menus com toque confortavel.
- Header fixo leve.
- Player OST sem cobrir conteudo.
- Botao de acao principal por tela.

Prioridade: alta.

---

### 5.4 Microinteracoes

Pequenas animacoes deixam a interface mais viva.

Ideias:

- Dado jogando no aleatorio.
- Card abrindo com transicao para detalhes.
- Botao de favoritar com pulso.
- Conquista entrando com impacto.
- Progresso de episodio com animacao.
- Cards aparecendo com stagger leve.

Prioridade: media.

---

### 5.5 Acessibilidade

Melhorias importantes:

- Contraste consistente em todos os temas.
- Foco visivel em teclado.
- Labels em inputs e selects.
- `aria-live` para toasts.
- Botao com `aria-label` quando for apenas icone.
- Respeitar `prefers-reduced-motion`.
- Tamanhos minimos de toque no mobile.

Prioridade: alta.

---

## 6. Melhorias Tecnicas

### 6.1 Reduzir CSS Legado

O CSS atual tem regras duplicadas e conflitos entre `style.css`, `v6_styles.css` e `app-polish.css`.

Plano:

1. Mapear classes duplicadas.
2. Criar tokens e componentes finais.
3. Migrar paginas aos poucos.
4. Remover overrides antigos.
5. Manter `app-polish.css` como camada temporaria ate consolidar.

Prioridade: alta.

---

### 6.2 Trocar `onclick` Inline por Event Listeners

Muitos elementos ainda usam `onclick` direto no HTML. Isso dificulta manutencao.

Plano:

- Usar `data-action`.
- Centralizar listeners em JS.
- Evitar montar HTML com eventos inline.
- Facilitar testes e acessibilidade.

Prioridade: media-alta.

---

### 6.3 Testes Basicos

Adicionar testes simples ja traria muito valor.

Sugestoes:

- `php -l` em todos os PHP.
- `node --check` em todos os JS.
- Teste HTTP das paginas principais.
- Smoke test de login, explorar, calendario e lista.
- Verificacao de manifest e service worker.

Prioridade: alta.

---

### 6.4 Performance

Melhorias:

- Lazy load de imagens.
- Cache de respostas AniList.
- Placeholder local padrao.
- Evitar traducao/sincronizacao pesada durante render.
- Reduzir chamadas duplicadas.
- Medir tamanho de JS/CSS.

Prioridade: media.

---

### 6.5 Observabilidade

Ideias:

- Logs de erro no frontend.
- Painel admin com ultimos erros.
- Health check expandido.
- Contador de falhas da AniList.
- Status de cache.
- Log de eventos importantes.

Prioridade: media.

---

## 7. Roadmap Recomendado

### Fase 1 - Consolidacao da v7

Objetivo: deixar tudo consistente e confiavel.

- Revisar contraste e botoes em todas as paginas.
- Padronizar botao, card, chip, modal e toast.
- Corrigir imagens quebradas restantes.
- Validar mobile nas paginas principais.
- Remover conflitos obvios de CSS.
- Criar checklist de validacao.

Resultado esperado: v7 visualmente mais profissional e com menos bugs pequenos.

Prioridade: imediata.

---

### Fase 2 - Home como Painel Principal

Objetivo: transformar a Home em uma central de acao.

- Continuar assistindo.
- Proximo episodio.
- Missao semanal.
- Anime recomendado.
- Ultima conquista.
- Atalhos para Explorar, Calendario e Lista.

Resultado esperado: usuario entende o valor do site nos primeiros segundos.

Prioridade: alta.

---

### Fase 3 - Explorar e Calendario Premium

Objetivo: melhorar descoberta e acompanhamento.

- Filtros em bottom sheet no mobile.
- Presets melhores no Explorar.
- Estado vazio rico.
- Calendario com modo compacto/detalhado.
- Lembretes internos para animes seguidos.
- Melhor integracao com lista "Assistindo".

Resultado esperado: descoberta mais divertida e calendario mais util.

Prioridade: alta.

---

### Fase 4 - Perfil, Missoes e Gamificacao

Objetivo: aumentar retencao.

- Perfil com badges e titulo equipado.
- Missoes semanais.
- XP melhor distribuido.
- Conquistas por comportamento.
- Molduras e raridades.
- Pagina de colecao.

Resultado esperado: o usuario tem motivo para voltar.

Prioridade: media-alta.

---

### Fase 5 - Refatoracao Tecnica

Objetivo: preparar o projeto para crescer.

- Reduzir CSS duplicado.
- Tirar `onclick` inline.
- Criar camada de componentes JS.
- Escrever testes basicos.
- Melhorar cache e logs.
- Documentar endpoints.

Resultado esperado: manutencao mais rapida e menos regressao.

Prioridade: media.

---

## 8. Backlog Priorizado

### Alta prioridade

- Padronizar componentes visuais.
- Revisar responsividade de todas as paginas.
- Criar painel "Hoje no AnimeEngine".
- Melhorar perfil.
- Criar missoes semanais.
- Adicionar testes/smoke checks.
- Limpar conflitos CSS mais graves.

### Media prioridade

- Melhorar player OST.
- Criar roleta premium.
- Evoluir estatisticas.
- Adicionar notificacoes internas por calendario.
- Melhorar PWA/offline.
- Adicionar filtros por humor.

### Baixa prioridade

- Tema builder.
- Exportar lista.
- Compartilhar cards de anime.
- Ranking publico.
- Comentarios/reviews.
- Integracao com calendario externo.

---

## 9. Ideias de Telas Novas

### 9.1 Dashboard

Uma tela mais densa para usuario logado:

- progresso semanal;
- episodios pendentes;
- lista de prioridades;
- conquistas recentes;
- estatisticas rapidas.

### 9.2 Central de Missoes

Pagina dedicada a metas, XP, streak e recompensas.

### 9.3 Colecao

Pagina para badges, titulos, temas desbloqueados e raridades.

### 9.4 Radio OST

Pagina dedicada para musicas, playlists e favoritos.

### 9.5 Comparador de Animes

Selecionar dois animes e comparar nota, episodios, status, generos, popularidade e sinopse.

### 9.6 Modo Maratona

Selecionar um anime e acompanhar sessoes de episodios com timer, pausas e progresso.

---

## 10. Criterios de Qualidade para Cada Mudanca

Antes de considerar uma feature pronta:

- Funciona em desktop.
- Funciona em mobile.
- Tem estado de loading.
- Tem estado de erro.
- Tem fallback de imagem.
- Nao quebra tema claro/escuro.
- Nao cria overflow horizontal.
- Passa em `php -l` ou `node --check`.
- Nao depende de dado externo sem tratamento de falha.
- Mantem a identidade visual da v7.

---

## 11. Checklist Semanal

- Revisar paginas principais no Chrome.
- Testar mobile em 390px.
- Rodar lint/sintaxe.
- Abrir Console e verificar erros.
- Testar imagens quebradas.
- Testar aleatorio.
- Testar player OST.
- Testar filtros do Explorar.
- Testar Calendario.
- Testar login/logout.
- Verificar `git status`.

---

## 12. Conclusao

O AnimeEngine v7 ja tem uma base muito boa: visual forte, varias paginas, dados reais, gamificacao e uma personalidade propria. O maior salto agora nao esta em adicionar dez telas soltas, mas em integrar melhor o que ja existe.

A melhor direcao e transformar a v7 em uma experiencia diaria:

- abrir;
- ver o que assistir;
- acompanhar progresso;
- descobrir algo novo;
- ganhar recompensas;
- voltar no dia seguinte.

Se a proxima etapa focar em consistencia visual, Home mais util, missoes semanais, perfil vivo e refatoracao gradual do CSS/JS, a v7 pode ficar com cara de produto completo, nao apenas projeto escolar ou catalogo experimental.

---

## 13. Proxima Acao Recomendada

Comecar pela **Fase 1 - Consolidacao da v7** e, em seguida, fazer a **Home como Painel Principal**. Essas duas frentes melhoram a percepcao de qualidade do site inteiro sem exigir uma reescrita grande.
