
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
    <script>
        // Random anime function
        async function goToRandomAnime() {
            const query = `
                query {
                    Page(page: 1, perPage: 50) {
                        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
                            id
                        }
                    }
                }
            `;
            
            try {
                const response = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
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
