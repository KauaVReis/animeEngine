<?php
/**
 * AnimeEngine v8 - Canonical Route Redirector
 * Redireciona acessos diretos legados (*.php) para a rota canônica gerenciada pelo Front Controller.
 */
$page = basename(__FILE__, '.php');
$query = !empty($_SERVER['QUERY_STRING']) ? '?' . $_SERVER['QUERY_STRING'] : '';
header("Location: {$page}{$query}", true, 302);
exit;
