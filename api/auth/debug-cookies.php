<?php
// ARQUIVO TEMPORÁRIO PARA DEBUG - REMOVER EM PRODUÇÃO
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

$debug_info = [
    'cookies' => $_COOKIE,
    'headers' => function_exists('getallheaders') ? getallheaders() : [],
    'server' => [
        'HTTPS' => $_SERVER['HTTPS'] ?? 'not set',
        'SERVER_PORT' => $_SERVER['SERVER_PORT'] ?? 'not set',
        'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? 'not set',
        'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? 'not set',
        'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'] ?? 'not set',
        'HTTP_USER_AGENT' => $_SERVER['HTTP_USER_AGENT'] ?? 'not set'
    ],
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode($debug_info, JSON_PRETTY_PRINT);
?>
