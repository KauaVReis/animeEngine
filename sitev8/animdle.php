<?php
/**
 * AnimeEngine v8 — Canonical Route Redirector
 * Redireciona acessos legados diretos para o Front Controller
 */
$qs = !empty($_SERVER['QUERY_STRING']) ? '&' . $_SERVER['QUERY_STRING'] : '';
header('Location: index.php?page=animdle' . $qs, true, 302);
exit;
