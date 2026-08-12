<?php
declare(strict_types=1);

/**
 * Velza RSVP & Event Management System
 * Team Portal Configuration
 * Version: 1.0.0-alpha.2
 */

if (!defined('APP_START')) {
    define('APP_START', true);
}

/*
|--------------------------------------------------------------------------
| Timezone
|--------------------------------------------------------------------------
*/

date_default_timezone_set('Asia/Manila');

/*
|--------------------------------------------------------------------------
| Application
|--------------------------------------------------------------------------
*/

define('APP_NAME', 'Velza RSVP & Event Management System');
define('APP_VERSION', '1.0.0-alpha.2');

define('APP_ROOT', dirname(__DIR__));
define('PROJECT_ROOT', dirname(APP_ROOT));

/*
|--------------------------------------------------------------------------
| Private Configuration
|--------------------------------------------------------------------------
*/

$dbConfig = require '/home/velzhsrg/private_config/rsvp_db.php';

if (!is_array($dbConfig)) {
    throw new RuntimeException('Database configuration could not be loaded.');
}