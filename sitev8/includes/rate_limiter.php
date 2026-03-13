<?php
/**
 * AnimeEngine v8 - Rate Limiter
 * Proteção contra abuso de endpoints da API
 * 
 * Usa arquivos temporários para tracking (sem dependência de Redis/Memcached).
 * Limite padrão: 60 requisições por minuto por IP.
 */

define('RATE_LIMIT_DIR', sys_get_temp_dir() . '/animeengine_ratelimit/');
define('RATE_LIMIT_REQUESTS', 60);   // Máximo de requisições
define('RATE_LIMIT_WINDOW', 60);     // Janela de tempo em segundos (1 minuto)

/**
 * Verificar rate limit para o IP atual.
 * Chamar no topo de endpoints sensíveis da API.
 * 
 * @param int $maxRequests Limite customizado (opcional, padrão 60)
 * @param int $window      Janela em segundos (opcional, padrão 60)
 */
function verificar_rate_limit($maxRequests = RATE_LIMIT_REQUESTS, $window = RATE_LIMIT_WINDOW)
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ip_hash = md5($ip);
    
    // Criar diretório se não existe
    if (!is_dir(RATE_LIMIT_DIR)) {
        @mkdir(RATE_LIMIT_DIR, 0755, true);
    }
    
    $file = RATE_LIMIT_DIR . $ip_hash . '.json';
    
    $now = time();
    $data = ['requests' => [], 'blocked_until' => 0];
    
    // Ler dados existentes
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        if ($content) {
            $data = json_decode($content, true) ?? $data;
        }
    }
    
    // Verificar se IP está temporariamente bloqueado
    if ($data['blocked_until'] > $now) {
        $retry_after = $data['blocked_until'] - $now;
        header('Retry-After: ' . $retry_after);
        http_response_code(429);
        echo json_encode([
            'error' => true,
            'message' => "Muitas requisições. Tente novamente em {$retry_after} segundos.",
            'retry_after' => $retry_after
        ]);
        
        // Log de tentativa suspeita
        error_log("[AnimeEngine RateLimit] IP bloqueado tentou acesso: {$ip} | Endpoint: " . ($_SERVER['REQUEST_URI'] ?? 'unknown'));
        exit;
    }
    
    // Filtrar requisições dentro da janela de tempo
    $data['requests'] = array_filter($data['requests'], function ($timestamp) use ($now, $window) {
        return $timestamp > ($now - $window);
    });
    
    // Verificar limite
    if (count($data['requests']) >= $maxRequests) {
        // Bloquear IP por mais 1 minuto
        $data['blocked_until'] = $now + $window;
        @file_put_contents($file, json_encode($data));
        
        // Log
        error_log("[AnimeEngine RateLimit] IP bloqueado por excesso: {$ip} | {$maxRequests} requests em {$window}s");
        
        header('Retry-After: ' . $window);
        http_response_code(429);
        echo json_encode([
            'error' => true,
            'message' => 'Limite de requisições excedido. Tente novamente em breve.',
            'retry_after' => $window
        ]);
        exit;
    }
    
    // Registrar requisição
    $data['requests'][] = $now;
    @file_put_contents($file, json_encode($data));
    
    // Headers informativos
    $remaining = $maxRequests - count($data['requests']);
    header('X-RateLimit-Limit: ' . $maxRequests);
    header('X-RateLimit-Remaining: ' . $remaining);
    header('X-RateLimit-Reset: ' . ($now + $window));
}

/**
 * Rate limit mais restrito para endpoints de autenticação
 * Limite: 10 tentativas por minuto
 */
function verificar_rate_limit_auth()
{
    verificar_rate_limit(10, 60);
}

/**
 * Limpar arquivos de rate limit expirados (chamar periodicamente)
 */
function limpar_rate_limit_antigos()
{
    if (!is_dir(RATE_LIMIT_DIR)) return;
    
    $files = glob(RATE_LIMIT_DIR . '*.json');
    $now = time();
    
    foreach ($files as $file) {
        // Remover arquivos com mais de 5 minutos sem modificação
        if (filemtime($file) < $now - 300) {
            @unlink($file);
        }
    }
}
