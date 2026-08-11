<?php

declare(strict_types=1);

$pageTitle = 'Layout Test';
$activePage = 'dashboard';
$showNavigation = true;

require_once __DIR__ . '/includes/header.php';
?>

<div class="container-fluid">
    <section class="team-panel">
        <h1 class="team-portal-title">Team Portal Layout Test</h1>

        <p class="mb-4">
            If you can see the Velza background, navigation, glass panel styling,
            footer, and responsive layout, the shared layout is loading correctly.
        </p>

        <a class="btn team-btn-primary" href="#">
            Test Button
        </a>
    </section>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
