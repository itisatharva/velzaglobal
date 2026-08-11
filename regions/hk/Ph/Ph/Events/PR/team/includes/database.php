<?php
declare(strict_types=1);

/**
 * Team Portal Database Connection
 */

if (!isset($dbConfig) || !is_array($dbConfig)) {
    throw new RuntimeException('Database configuration is unavailable.');
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $db = new mysqli(
        $dbConfig['host'],
        $dbConfig['username'],
        $dbConfig['password'],
        $dbConfig['database']
    );

    $db->set_charset('utf8mb4');
} catch (mysqli_sql_exception $exception) {
    error_log('Team Portal database connection failed: ' . $exception->getMessage());

    throw new RuntimeException(
        'The Team Portal database connection could not be established.'
    );
}