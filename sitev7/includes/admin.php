<?php
/**
 * AnimeEngine v7 - Admin helpers
 */

require_once __DIR__ . '/auth.php';

function isAdmin()
{
    return intval(getUsuarioId()) === 1;
}

function requerAdmin()
{
    requerLogin();

    if (!isAdmin()) {
        http_response_code(403);
        echo 'Acesso restrito.';
        exit;
    }
}
