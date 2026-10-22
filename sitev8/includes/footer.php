
    <!-- MICRO-DOCK PLAYER NEO-BRUTALISTA (DISCRETO & PERSISTENTE) -->
    <div class="ost-micro-dock" id="ost-micro-dock" style="display: none;" role="region" aria-label="Controle Rápido de Áudio">
        <div class="ost-micro-thumb" id="ost-micro-thumb" onclick="if(window.OSTPlayer) OSTPlayer.show();" title="Abrir Player de Música">
            <i class="fas fa-music"></i>
        </div>
        <div class="ost-micro-info" id="ost-micro-info" onclick="if(window.OSTPlayer) OSTPlayer.show();" title="Clique para expandir o player completo">
            <div class="ost-micro-song" id="ost-micro-song">Nenhuma faixa</div>
            <div class="ost-micro-anime" id="ost-micro-anime">Rádio AnimeEngine</div>
        </div>
        <div class="ost-micro-actions">
            <button type="button" class="ost-micro-btn" id="ost-micro-prev" onclick="if(window.OSTPlayer) OSTPlayer.prev();" title="Faixa Anterior">
                <i class="fas fa-step-backward"></i>
            </button>
            <button type="button" class="ost-micro-btn play-btn" id="ost-micro-play" onclick="if(window.OSTPlayer) OSTPlayer.togglePlay();" title="Play / Pausar">
                <i class="fas fa-play" id="ost-micro-play-icon"></i>
            </button>
            <button type="button" class="ost-micro-btn" id="ost-micro-next" onclick="if(window.OSTPlayer) OSTPlayer.next();" title="Próxima Faixa">
                <i class="fas fa-step-forward"></i>
            </button>
            <button type="button" class="ost-micro-btn" onclick="document.getElementById('ost-micro-dock').style.display='none';" title="Ocultar Mini-Player">
                <i class="fas fa-times"></i>
            </button>
        </div>
    </div>

    <!-- TELEMETRY FOOTER STRIP -->
    <footer class="app-telemetry-footer" id="app-telemetry-footer">
        <div class="telemetry-inner">
            <div class="telemetry-cluster">
                <span class="telemetry-badge"><i class="fas fa-satellite-dish"></i> TRI-API v8</span>
                <span class="telemetry-item" id="tel-anilist"><span class="tel-dot dot-online"></span> ANILIST <b>OK</b></span>
                <span class="telemetry-item" id="tel-animethemes"><span class="tel-dot dot-online"></span> ANIMETHEMES <b>OK (HD)</b></span>
                <span class="telemetry-item" id="tel-jikan"><span class="tel-dot dot-standby"></span> JIKAN v4 <b>STANDBY</b></span>
            </div>
            <div class="telemetry-ticker-marquee">
                <span id="tel-marquee-text">🎧 11 ESTAÇÕES DE RÁDIO ATIVAS • DESAFIO ANIMDLE DO DIA DISPONÍVEL • MODO SPA 100% PERSISTENTE</span>
            </div>
            <div class="telemetry-meta">
                <span class="meta-tag">ANIME.ENGINE v8.0</span>
                <a href="?page=changelog" class="meta-link"><i class="fas fa-code-branch"></i> NOTAS</a>
            </div>
        </div>
    </footer>

    <!-- MODAL CONTAINER -->
    <div id="modal-container"></div>
    
    <!-- SCRIPTS -->
    <script src="js/api-client.js?v=9.7"></script>
    <script src="js/translation.js?v=9.7"></script>
    <script src="js/api.js?v=9.7"></script>
    <script src="js/storage.js?v=9.7"></script>
    <script src="js/themes.js?v=9.7"></script>
    <script src="js/achievements.js?v=9.7"></script>
    <script src="js/notifications.js?v=9.7"></script>
    <script src="js/goals.js?v=9.7"></script>
    <script src="js/quotes.js?v=9.7"></script>
    <script src="js/particles.js?v=9.7"></script>
    <script src="js/services/music-service.js?v=9.7"></script>
    <script src="js/ost-player.js?v=9.7"></script>
    <script src="js/core/spa-router.js?v=9.7"></script>
    <script src="js/common.js?v=9.7"></script>
    <script>
        // Random anime function (v8 - SPA navigation + API fallback resilience)
        async function goToRandomAnime() {
            try {
                if (typeof API !== 'undefined' && API.getRandomAnime) {
                    const random = await API.getRandomAnime();
                    if (random && random.id) {
                        const url = '?page=detalhes&id=' + random.id;
                        if (typeof Common !== 'undefined' && Common.navigate) {
                            Common.navigate(url);
                        } else if (typeof SpaRouter !== 'undefined') {
                            SpaRouter.navigateTo(url);
                        } else {
                            window.location.href = url;
                        }
                        return;
                    }
                }
            } catch (e) {
                console.error('Erro ao buscar anime aleatório:', e);
            }
        }
    </script>
    <?php if (isset($scripts_pagina)): ?>
        <?php foreach ($scripts_pagina as $script): ?>
            <script src="<?= strpos($script, 'http') === 0 ? $script : $script . '?v=9.7' ?>" data-spa-page-script="<?= $script ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
