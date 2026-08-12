<?php
declare(strict_types=1);

/**
 * Team Portal Authentication Helpers
 */

function is_logged_in(): bool
{
    return isset($_SESSION['team_user_id'])
        && is_int($_SESSION['team_user_id'])
        && $_SESSION['team_user_id'] > 0;
}

function current_user_id(): ?int
{
    return is_logged_in() ? $_SESSION['team_user_id'] : null;
}

function require_login(): void
{
    if (!is_logged_in()) {
        $_SESSION['intended_url'] = $_SERVER['REQUEST_URI']
            ?? '/Ph/Events/PR/team/dashboard.php';

        redirect('/Ph/Events/PR/team/login.php');
    }
}

function logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            (bool) $params['secure'],
            (bool) $params['httponly']
        );
    }

    session_destroy();
}