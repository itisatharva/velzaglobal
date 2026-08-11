<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$pageTitle = isset($pageTitle) && is_string($pageTitle) && trim($pageTitle) !== ''
    ? trim($pageTitle)
    : 'Team Portal';

$activePage = isset($activePage) && is_string($activePage)
    ? $activePage
    : '';

$showNavigation = isset($showNavigation)
    ? (bool) $showNavigation
    : is_logged_in();

$fullPageTitle = $pageTitle . ' | ' . APP_NAME;

/**
 * Returns the Bootstrap active class for the selected navigation item.
 */
function navigation_class(string $page, string $activePage): string
{
    return $page === $activePage ? ' active' : '';
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#07152b">

    <title><?= e($fullPageTitle) ?></title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
    >

    <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
        crossorigin="anonymous"
    >

    <link
        rel="stylesheet"
        href="/Ph/Events/PR/team/assets/css/team.css?v=<?= rawurlencode(APP_VERSION) ?>"
    >
</head>

<body class="team-portal-body">

<div class="team-background" aria-hidden="true"></div>
<div class="team-background-overlay" aria-hidden="true"></div>

<div class="team-page-shell">

    <?php if ($showNavigation): ?>
        <nav class="navbar navbar-expand-lg team-navbar">
            <div class="container-fluid">

                <a
                    class="navbar-brand d-flex align-items-center"
                    href="/Ph/Events/PR/team/dashboard.php"
                    aria-label="<?= e(APP_NAME) ?> dashboard"
                >
                    <img
                        src="/Ph/Events/PR/Velza%20Logo%20-%201.png"
                        alt="Velza Global"
                        class="team-navbar-logo"
                    >
                </a>

                <button
                    class="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#teamPortalNavigation"
                    aria-controls="teamPortalNavigation"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div
                    class="collapse navbar-collapse"
                    id="teamPortalNavigation"
                >
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">

                        <li class="nav-item">
                            <a
                                class="nav-link<?= navigation_class('dashboard', $activePage) ?>"
                                href="/Ph/Events/PR/team/dashboard.php"
                            >
                                Dashboard
                            </a>
                        </li>

                        <li class="nav-item">
                            <a
                                class="nav-link<?= navigation_class('guests', $activePage) ?>"
                                href="/Ph/Events/PR/team/guests/"
                            >
                                Guests
                            </a>
                        </li>

                        <li class="nav-item">
                            <a
                                class="nav-link<?= navigation_class('reports', $activePage) ?>"
                                href="/Ph/Events/PR/team/reports/"
                            >
                                Reports
                            </a>
                        </li>

                        <li class="nav-item">
                            <a
                                class="nav-link<?= navigation_class('users', $activePage) ?>"
                                href="/Ph/Events/PR/team/users/"
                            >
                                Users
                            </a>
                        </li>

                        <li class="nav-item">
                            <a
                                class="nav-link<?= navigation_class('audit', $activePage) ?>"
                                href="/Ph/Events/PR/team/audit/"
                            >
                                Audit
                            </a>
                        </li>

                    </ul>

                    <div class="d-flex align-items-center gap-3">
                        <span class="team-user-label">
                            Team Portal
                        </span>

                        <a
                            class="btn btn-sm team-btn-outline"
                            href="/Ph/Events/PR/team/logout.php"
                        >
                            Sign out
                        </a>
                    </div>
                </div>

            </div>
        </nav>
    <?php endif; ?>

    <main class="team-main-content">
PHP