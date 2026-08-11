<?php
declare(strict_types=1);

/**
 * Team Portal Secure Session Configuration
 */

if (session_status() === PHP_SESSION_ACTIVE) {
    return;
}

$isHttps = !empty($_SERVER['HTTPS'])
    && strtolower((string) $_SERVER['HTTPS']) !== 'off';

session_name('VELZA_TEAM_SESSION');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/Ph/Events/PR/team/',
    'domain' => '',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict',
]);

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Strict');

if ($isHttps) {
    ini_set('session.cookie_secure', '1');
}

session_start();