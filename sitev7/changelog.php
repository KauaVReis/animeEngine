<?php
/**
 * AnimeEngine v7 - Changelog
 */

$titulo_pagina = 'Changelog - ANIME.ENGINE v7';
require_once 'includes/header.php';
require_once 'includes/nav.php';
?>

<main class="main-content changelog-page">
    <section class="changelog-hero">
        <div class="changelog-hero-copy">
            <span class="calendar-eyebrow">Histórico do projeto</span>
            <h1>Changelog<br>AnimeEngine</h1>
            <p>Uma linha do tempo visual da evolução do site, das primeiras versões em HTML até o sitev7 com autenticação, listas, calendário, exploração avançada e refinamentos de UI.</p>
        </div>
        <div class="changelog-release-card">
            <span>Versão atual</span>
            <strong>sitev7</strong>
            <small>Base oficial em evolução contínua</small>
        </div>
    </section>

    <section class="changelog-stats">
        <div class="calendar-stat"><strong>7+</strong><span>Versões históricas</span></div>
        <div class="calendar-stat"><strong>20+</strong><span>Páginas e módulos</span></div>
        <div class="calendar-stat"><strong>40+</strong><span>Commits recentes</span></div>
        <div class="calendar-stat"><strong>2026</strong><span>Ciclo atual</span></div>
    </section>

    <section class="changelog-section">
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-layer-group"></i> Linha do tempo</h2>
        </div>

        <div class="changelog-timeline">
            <article class="changelog-entry current">
                <div class="changelog-marker">v7</div>
                <div class="changelog-card">
                    <div class="changelog-card-head">
                        <span class="calendar-eyebrow">Atual</span>
                        <h3>AnimeEngine v7 oficial</h3>
                    </div>
                    <p>Consolidação do site atual em PHP, includes reutilizáveis, autenticação, APIs internas, listas, painel admin, PWA, cache, segurança e polimento visual.</p>
                    <ul>
                        <li>Header fixo e refinado, home mais estável e responsiva.</li>
                        <li>Calendário da temporada com próximo episódio, estatísticas e filtros.</li>
                        <li>Explorar com filtros avançados, presets e seção de OSTs.</li>
                        <li>Correções de imagens, player de música e sorteio aleatório.</li>
                    </ul>
                </div>
            </article>

            <article class="changelog-entry">
                <div class="changelog-marker">v6</div>
                <div class="changelog-card">
                    <div class="changelog-card-head">
                        <span class="calendar-eyebrow">Neo-brutalismo</span>
                        <h3>Sistema visual e experiência local</h3>
                    </div>
                    <p>A v6 trouxe a base visual mais forte do projeto: temas, partículas, rádio OST, componentes globais e páginas mais completas.</p>
                    <ul>
                        <li>Design neo-brutalist com múltiplos temas.</li>
                        <li>Calendário, explorar, estatísticas, assistindo e favoritos.</li>
                        <li>Quotes, goals, achievements, notificações e roleta.</li>
                    </ul>
                </div>
            </article>

            <article class="changelog-entry">
                <div class="changelog-marker">v5</div>
                <div class="changelog-card">
                    <div class="changelog-card-head">
                        <span class="calendar-eyebrow">Produto</span>
                        <h3>Primeira experiência multipágina completa</h3>
                    </div>
                    <p>A v5 expandiu o site para uma experiência de app, com páginas dedicadas para listas, detalhes, calendário, calculadora e favoritos.</p>
                    <ul>
                        <li>Estrutura por páginas e scripts separados.</li>
                        <li>Armazenamento local mais robusto.</li>
                        <li>Fluxos de assistir, favoritos e histórico.</li>
                    </ul>
                </div>
            </article>

            <article class="changelog-entry">
                <div class="changelog-marker">v4</div>
                <div class="changelog-card">
                    <div class="changelog-card-head">
                        <span class="calendar-eyebrow">Gamificação</span>
                        <h3>Achievements, listas e compartilhamento</h3>
                    </div>
                    <p>A v4 começou a transformar o AnimeEngine em uma experiência mais personalizada, com progresso, conquistas e módulos JS próprios.</p>
                    <ul>
                        <li>Sistema de achievements.</li>
                        <li>Módulos de listas, temas, storage e share.</li>
                        <li>Base para interações mais ricas.</li>
                    </ul>
                </div>
            </article>

            <article class="changelog-entry">
                <div class="changelog-marker">v1-v3</div>
                <div class="changelog-card">
                    <div class="changelog-card-head">
                        <span class="calendar-eyebrow">Fundação</span>
                        <h3>Protótipos e primeiros fluxos</h3>
                    </div>
                    <p>As primeiras versões validaram a ideia central: catálogo de animes, cards visuais, interações em JavaScript e evolução gradual do layout.</p>
                    <ul>
                        <li>HTML, CSS e JavaScript concentrados.</li>
                        <li>Primeiras experiências de catálogo e busca.</li>
                        <li>Base estética que depois evoluiu para o v7.</li>
                    </ul>
                </div>
            </article>
        </div>
    </section>

    <section class="changelog-section">
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-code-commit"></i> Marcos dos commits</h2>
        </div>

        <div class="commit-grid">
            <article class="commit-card">
                <span>cf52245</span>
                <strong>Relatório de melhorias e branch test-09-05</strong>
                <small>09/05/2026</small>
            </article>
            <article class="commit-card">
                <span>30337a5</span>
                <strong>Arquitetura completa com autenticação e integrações</strong>
                <small>13/03/2026</small>
            </article>
            <article class="commit-card">
                <span>c54f80a</span>
                <strong>Estrutura inicial do AnimeEngine v7</strong>
                <small>12/03/2026</small>
            </article>
            <article class="commit-card">
                <span>ebcc574</span>
                <strong>v7 definido como oficial e versões antigas movidas</strong>
                <small>11/03/2026</small>
            </article>
            <article class="commit-card">
                <span>d7b2b13</span>
                <strong>Calendário semanal de animes da temporada</strong>
                <small>10/03/2026</small>
            </article>
            <article class="commit-card">
                <span>34fa77f</span>
                <strong>Explorar com filtros avançados e seção de OSTs</strong>
                <small>10/03/2026</small>
            </article>
            <article class="commit-card">
                <span>c10eaab</span>
                <strong>Tier List para animes completos</strong>
                <small>10/03/2026</small>
            </article>
            <article class="commit-card">
                <span>ce6683c</span>
                <strong>Sistema visual neo-brutalist e temas</strong>
                <small>Histórico v6/v7</small>
            </article>
        </div>
    </section>

    <section class="changelog-section">
        <div class="section-header">
            <h2 class="section-title"><i class="fas fa-screwdriver-wrench"></i> Ciclo atual de melhorias</h2>
        </div>

        <div class="changelog-improvements">
            <article>
                <i class="fas fa-shield-halved"></i>
                <strong>Segurança e APIs</strong>
                <p>CSRF, rate limit, prepared statements, logs, cache e headers de segurança foram priorizados a partir da análise do relatório.</p>
            </article>
            <article>
                <i class="fas fa-wand-magic-sparkles"></i>
                <strong>UI/UX</strong>
                <p>Header fixo, home refinada, estados vazios, botões consistentes, animações de navegação e responsividade revisada.</p>
            </article>
            <article>
                <i class="fas fa-music"></i>
                <strong>Música e mídia</strong>
                <p>Player OST com fallback, tratamento de erro do YouTube, capas mais confiáveis e imagens quebradas protegidas por placeholder local.</p>
            </article>
            <article>
                <i class="fas fa-calendar-days"></i>
                <strong>Descoberta de animes</strong>
                <p>Calendário e Explorar ganharam controles mais diretos, filtros úteis, presets e melhor leitura em desktop e mobile.</p>
            </article>
        </div>
    </section>
</main>

<?php
require_once 'includes/footer.php';
?>
