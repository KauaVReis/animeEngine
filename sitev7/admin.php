<?php
$titulo_pagina = 'Admin - ANIME.ENGINE v7';

require_once 'includes/admin.php';
requerAdmin();
require_once 'includes/header.php';
require_once 'includes/nav.php';

$conn = conectar();

function scalarQuery($conn, $sql)
{
    $result = dbSelect($conn, $sql);
    if (!$result) return 0;
    $row = mysqli_fetch_row($result);
    return intval($row[0] ?? 0);
}

$metrics = [
    'usuarios' => scalarQuery($conn, 'SELECT COUNT(*) FROM usuarios'),
    'animes' => scalarQuery($conn, 'SELECT COUNT(*) FROM animes_cache'),
    'listas' => scalarQuery($conn, 'SELECT COUNT(*) FROM listas_anime'),
    'conquistas' => scalarQuery($conn, 'SELECT COUNT(*) FROM conquistas'),
    'atividades' => scalarQuery($conn, 'SELECT COUNT(*) FROM atividades')
];

$recentUsers = [];
$usersResult = dbSelect($conn, 'SELECT id, username, email, nivel, xp, criado_em, ultimo_acesso FROM usuarios ORDER BY criado_em DESC LIMIT 8');
if ($usersResult) {
    while ($row = mysqli_fetch_assoc($usersResult)) {
        $recentUsers[] = $row;
    }
}

function readLogTail($file, $limit = 8)
{
    $path = __DIR__ . '/logs/' . $file;
    if (!is_readable($path)) return [];

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    return array_slice($lines ?: [], -$limit);
}

$apiLogs = readLogTail('api.log');
$securityLogs = readLogTail('security.log');
$dbLogs = readLogTail('database.log');

mysqli_close($conn);
?>

<main class="main-content admin-page">
    <section class="admin-header">
        <div>
            <h1 class="section-title">Admin</h1>
            <p class="section-subtitle">SAUDE DO SISTEMA</p>
        </div>
        <a class="btn btn-primary" href="api/health.php" target="_blank">
            <i class="fas fa-heart-pulse"></i> Healthcheck
        </a>
    </section>

    <section class="admin-metrics">
        <?php foreach ($metrics as $label => $value): ?>
            <article class="admin-metric">
                <span><?= htmlspecialchars(ucfirst($label)) ?></span>
                <strong><?= number_format($value, 0, ',', '.') ?></strong>
            </article>
        <?php endforeach; ?>
    </section>

    <section class="admin-grid">
        <article class="admin-panel">
            <h2>Usuários recentes</h2>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuário</th>
                            <th>Nível</th>
                            <th>XP</th>
                            <th>Último acesso</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recentUsers as $user): ?>
                            <tr>
                                <td><?= intval($user['id']) ?></td>
                                <td><?= htmlspecialchars($user['username']) ?></td>
                                <td><?= intval($user['nivel']) ?></td>
                                <td><?= intval($user['xp']) ?></td>
                                <td><?= htmlspecialchars($user['ultimo_acesso'] ?? '-') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </article>

        <article class="admin-panel">
            <h2>Logs de segurança</h2>
            <pre class="admin-log"><?= htmlspecialchars(implode("\n", $securityLogs) ?: 'Sem eventos recentes') ?></pre>
        </article>

        <article class="admin-panel">
            <h2>Logs de API</h2>
            <pre class="admin-log"><?= htmlspecialchars(implode("\n", $apiLogs) ?: 'Sem erros recentes') ?></pre>
        </article>

        <article class="admin-panel">
            <h2>Banco de dados</h2>
            <pre class="admin-log"><?= htmlspecialchars(implode("\n", $dbLogs) ?: 'Sem queries lentas recentes') ?></pre>
        </article>
    </section>
</main>

<?php require_once 'includes/footer.php'; ?>
