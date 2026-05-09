
    <!-- MODAL CONTAINER -->
    <div id="modal-container"></div>
    
    <!-- SCRIPTS -->
    <script src="js/api-client.js"></script>
    <script src="js/translation.js"></script>
    <script src="js/api.js"></script>
    <script src="js/storage.js"></script>
    <script src="js/themes.js"></script>
    <script src="js/achievements.js"></script>
    <script src="js/notifications.js"></script>
    <script src="js/goals.js"></script>
    <script src="js/quotes.js"></script>
    <script src="js/particles.js"></script>
    <script src="js/ost-player.js"></script>
    <script src="js/common.js"></script>
    <script src="js/pwa.js"></script>
    <script>
        // Random anime function
        async function goToRandomAnime(event = null) {
            if (window.Common?.goToRandomAnime) {
                Common.goToRandomAnime(event?.currentTarget || event?.target || document.activeElement);
                return;
            }

            const page = Math.floor(Math.random() * 150) + 1;
            const sorts = ['POPULARITY_DESC', 'TRENDING_DESC', 'SCORE_DESC', 'FAVOURITES_DESC'];
            const sort = sorts[Math.floor(Math.random() * sorts.length)];
            const query = `
                query ($page: Int, $sort: [MediaSort]) {
                    Page(page: $page, perPage: 20) {
                        media(type: ANIME, sort: $sort, isAdult: false) {
                            id
                        }
                    }
                }
            `;
            
            try {
                const response = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { page, sort: [sort] } })
                });
                
                const data = await response.json();
                const animes = data.data?.Page?.media || [];
                
                if (animes.length > 0) {
                    const random = animes[Math.floor(Math.random() * animes.length)];
                    window.location.href = 'detalhes.php?id=' + random.id;
                }
            } catch (e) {
                console.error('Erro ao buscar anime aleatório:', e);
            }
        }
    </script>
    <?php if (isset($scripts_pagina)): ?>
        <?php foreach ($scripts_pagina as $script): ?>
            <script src="<?= $script ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
