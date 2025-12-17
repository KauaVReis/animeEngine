
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
    <?php if (isset($scripts_pagina)): ?>
        <?php foreach ($scripts_pagina as $script): ?>
            <script src="<?= $script ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
