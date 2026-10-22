<?php
/**
 * AnimeEngine v8 - View: Changelog & Notas de Atualização
 * Histórico detalhado da evolução do AnimeEngine (v1.0 -> v8.0)
 */
?>

<div class="changelog-page-wrapper" id="changelog-page">
    <!-- HEADER DO CHANGELOG -->
    <header class="changelog-hero-card">
        <div class="changelog-hero-main">
            <div class="changelog-badge-row">
                <span class="cl-pill cl-pill-live"><span class="cl-dot"></span> BUILD ATUAL: v8.0.0</span>
                <span class="cl-pill">OUTUBRO 2026</span>
                <span class="cl-pill">SPA • NEO-BRUTALIST</span>
            </div>
            <h1 class="page-title changelog-title">
                <i class="fas fa-clipboard-list"></i> CHANGELOG &amp; EVOLUÇÃO
            </h1>
            <p class="changelog-subtitle">
                Registro completo de arquitetura, recursos musicais, design system e melhorias técnicas do AnimeEngine.
            </p>
        </div>

        <!-- FILTRO RÁPIDO DE VERSÕES -->
        <div class="changelog-filter-bar" role="tablist" aria-label="Filtrar notas de versão">
            <button type="button" class="cl-filter-btn active" onclick="filterChangelog('all', this)">Todas</button>
            <button type="button" class="cl-filter-btn" onclick="filterChangelog('v8', this)">v8.0 SPA</button>
            <button type="button" class="cl-filter-btn" onclick="filterChangelog('v7', this)">v7.0 PHP</button>
            <button type="button" class="cl-filter-btn" onclick="filterChangelog('legacy', this)">v6.0 – v1.0</button>
        </div>
    </header>

    <!-- TIMELINE DE RELEASES -->
    <div class="changelog-timeline">
        <!-- ==================== VERSÃO 8.0.0 ==================== -->
        <article class="cl-release-card cl-featured" data-cl-group="v8">
            <div class="cl-release-header">
                <div class="cl-version-block">
                    <span class="cl-version-tag">v8.0.0</span>
                    <div>
                        <h2 class="cl-release-title">Overdrive Musical, Arquitetura SPA &amp; Design System</h2>
                        <span class="cl-release-date"><i class="far fa-calendar-check"></i> Outubro 2026 • Lançamento Principal</span>
                    </div>
                </div>
                <span class="cl-status-badge status-current">VERSÃO ATUAL</span>
            </div>

            <p class="cl-release-summary">
                A maior evolução técnica do AnimeEngine: transição completa para Single-Page Application (SPA) sem recarregamento de página, novo motor musical unificado integrado à AnimeThemes API com 11 estações temáticas, estreia do jogo Animdle e auditoria completa de Design System e contraste nos 30 temas.
            </p>

            <div class="cl-sections-grid">
                <div class="cl-section-box">
                    <h3 class="cl-section-heading"><i class="fas fa-bolt"></i> Arquitetura SPA &amp; Resiliência</h3>
                    <ul class="cl-list">
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>Front Controller &amp; SpaRouter:</strong> Navegação fluida via AJAX + History API preservando o estado global e a reprodução de música/vídeo entre telas.</li>
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>Fallback Automático AniList → AnimeThemes:</strong> Circuit-breaker inteligente em <code>js/api.js</code> que mantém Home, Explorar, Busca e Detalhes operando mesmo quando a API da AniList sai do ar.</li>
                        <li><span class="cl-tag tag-imp">MELHORIA</span> <strong>Isolamento de Escopo:</strong> Carregamento dinâmico de scripts e folhas de estilo por rota com transições suaves e skeleton screens Neo-Brutalistas.</li>
                    </ul>
                </div>

                <div class="cl-section-box">
                    <h3 class="cl-section-heading"><i class="fas fa-broadcast-tower"></i> Rádio AnimeThemes &amp; 11 Estações</h3>
                    <ul class="cl-list">
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>Catálogo Real AnimeThemes:</strong> Reprodução contínua de Openings e Endings originais em alta definição via <code>MusicService</code> e <code>OSTPlayer</code>, sem confundir trailers promocionais com temas musicais.</li>
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>11 Estações Temáticas + Ambiência Visual:</strong> Curadoria por estilo musical e época (<em>Aleatória, Top Hits, New Wave, Minha Lista, Shonen Overdrive, Cyber-Synth 2099, Nostalgia 90s/00s, Lo-Fi &amp; Chill, Eclipse Seinen, Idol &amp; Pop, Matrix Terminal</em>) que sincroniza o tema e partículas da página.</li>
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>Palco Duplo (Clipe 16:9 &amp; Vitrola):</strong> Alternância instantânea entre o vídeo original e a vitrola animada com equalizador, fila interativa, busca no catálogo e histórico.</li>
                    </ul>
                </div>

                <div class="cl-section-box">
                    <h3 class="cl-section-heading"><i class="fas fa-gamepad"></i> Animdle — Music Quiz (Arcade)</h3>
                    <ul class="cl-list">
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>Modo Desafio Diário &amp; Modo Infinito:</strong> Descubra o anime ouvindo trechos progressivos de 1s, 3s, 6s, 10s e 15s com revelação gradual da capa borrada.</li>
                        <li><span class="cl-tag tag-new">NOVO</span> <strong>Calendário de Desafios &amp; Concorrência Limpa:</strong> Histórico de dias concluídos salvo localmente e pausa automática da Rádio durante o quiz.</li>
                    </ul>
                </div>

                <div class="cl-section-box">
                    <h3 class="cl-section-heading"><i class="fas fa-palette"></i> Design System &amp; Auditoria Visual</h3>
                    <ul class="cl-list">
                        <li><span class="cl-tag tag-fix">CORREÇÃO</span> <strong>Contraste Multi-Tema Garantido:</strong> Novos tokens semânticos <code>--color-on-primary</code> e <code>--station-on-accent</code> garantindo leitura perfeita nos 30 temas (incluindo <em>Matrix, Cyberpunk, Gold, Sakura e Zen</em>).</li>
                        <li><span class="cl-tag tag-imp">MELHORIA</span> <strong>Tuner Header Compacto &amp; <code>.btn-icon-neo</code>:</strong> Seletor de estações em linha com filtro de categorias e botões de ação secundária compactos (<code>36×36px</code>), mantendo o palco e a fila 100% acima da dobra.</li>
                    </ul>
                </div>
            </div>
        </article>

        <!-- ==================== VERSÃO 7.0.0 ==================== -->
        <article class="cl-release-card" data-cl-group="v7">
            <div class="cl-release-header">
                <div class="cl-version-block">
                    <span class="cl-version-tag tag-v7">v7.0.0</span>
                    <div>
                        <h2 class="cl-release-title">Geração Full-Stack PHP, Autenticação &amp; Perfis</h2>
                        <span class="cl-release-date"><i class="far fa-calendar-alt"></i> 2026 • Base Estável de Referência</span>
                    </div>
                </div>
                <span class="cl-status-badge">ESTÁVEL</span>
            </div>

            <p class="cl-release-summary">
                Introdução do backend completo em PHP com banco de dados relacional, sistema de contas, listas sincronizadas na nuvem, ranking comunitário e evolução de perfil.
            </p>

            <ul class="cl-list cl-compact-list">
                <li><span class="cl-tag tag-new">NOVO</span> <strong>Sistema de Autenticação &amp; Sessão:</strong> Login, cadastro, níveis de usuário (Lv.1 a Lv.10), títulos desbloqueáveis e edição de perfil.</li>
                <li><span class="cl-tag tag-new">NOVO</span> <strong>Sincronização de Listas &amp; Favoritos:</strong> Persistência em banco de dados para <em>Assistindo, Minha Lista, Favoritos</em> e avaliações.</li>
                <li><span class="cl-tag tag-new">NOVO</span> <strong>Estatísticas &amp; Streaks:</strong> Gráficos de gêneros, horas assistidas, metas semanais e contador de sequência diária.</li>
            </ul>
        </article>

        <!-- ==================== VERSÃO 6.0.0 ==================== -->
        <article class="cl-release-card" data-cl-group="legacy">
            <div class="cl-release-header">
                <div class="cl-version-block">
                    <span class="cl-version-tag tag-v6">v6.0.0</span>
                    <div>
                        <h2 class="cl-release-title">Revolução Visual Neo-Brutalista &amp; 30 Temas</h2>
                        <span class="cl-release-date"><i class="far fa-calendar-alt"></i> Legado v6</span>
                    </div>
                </div>
                <span class="cl-status-badge">LEGADO</span>
            </div>

            <ul class="cl-list cl-compact-list">
                <li><span class="cl-tag tag-new">NOVO</span> <strong>Identidade Neo-Brutalista:</strong> Tipografia <code>Archivo Black</code> + <code>Space Grotesk</code>, bordas marcantes de <code>3px</code> e sombras duras deslocadas.</li>
                <li><span class="cl-tag tag-new">NOVO</span> <strong>Ecossistema de 30 Temas &amp; Partículas:</strong> 6 temas públicos + 24 temas secretos desbloqueáveis via códigos, além de Tier List, Calendário Sazonal e Calculadora de Tempo.</li>
            </ul>
        </article>

        <!-- ==================== VERSÕES 5.0 A 1.0 ==================== -->
        <article class="cl-release-card" data-cl-group="legacy">
            <div class="cl-release-header">
                <div class="cl-version-block">
                    <span class="cl-version-tag tag-legacy">v1.0 – v5.0</span>
                    <div>
                        <h2 class="cl-release-title">Fundação &amp; Primeiras Gerações do AnimeEngine</h2>
                        <span class="cl-release-date"><i class="fas fa-history"></i> Arquivo Histórico</span>
                    </div>
                </div>
                <span class="cl-status-badge">ARQUIVO</span>
            </div>

            <ul class="cl-list cl-compact-list">
                <li><strong>Versão 5.0:</strong> Integração com APIs públicas (Jikan / AniList), busca dinâmica e filtros avançados.</li>
                <li><strong>Versão 4.0:</strong> Primeiros temas personalizáveis e sistema embrionário de conquistas (Achievements).</li>
                <li><strong>Versão 3.0:</strong> Primeiro layout totalmente responsivo com animações de interface.</li>
                <li><strong>Versões 1.0 &amp; 2.0:</strong> Protótipos fundadores em HTML/CSS/JS estático focados em organização de lista pessoal.</li>
            </ul>
        </article>
    </div>
</div>

<script>
function filterChangelog(group, btnEl) {
    document.querySelectorAll('.cl-filter-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    document.querySelectorAll('.cl-release-card').forEach(card => {
        const match = (group === 'all') || (card.getAttribute('data-cl-group') === group);
        card.style.display = match ? 'flex' : 'none';
    });
}
</script>
