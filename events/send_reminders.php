<?php

declare(strict_types=1);

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

date_default_timezone_set('Asia/Manila');

const EVENT_NAME = 'Velza Global Press Conference';
const EVENT_DATE = 'Tuesday, 4 August 2026';
const EVENT_TIME = '11:00 AM';
const EVENT_VENUE = 'WERCO Complex';
const EVENT_ADDRESS =
    '1700 Dr. A. Santos Avenue, San Antonio, Parañaque City, Metro Manila';

const LOG_FILE = __DIR__ . '/reminder_mail.log';
const LOCK_FILE = __DIR__ . '/send_reminders.lock';

$smtpConfig = require '/home/velzhsrg/private_config/rsvp_smtp.php';
$dbConfig   = require '/home/velzhsrg/private_config/rsvp_db.php';

/**
 * Default mode is always dry run.
 *
 * Live sending requires:
 * php send_reminders.php --send
 */
$sendMode = in_array('--send', $argv ?? [], true);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("This script can only run from the command line.\n");
}

/**
 * Prevent two cron jobs or manual commands from running simultaneously.
 */
$lockHandle = fopen(LOCK_FILE, 'c');

if ($lockHandle === false || !flock($lockHandle, LOCK_EX | LOCK_NB)) {
    exit("Another reminder process is already running.\n");
}

register_shutdown_function(
    static function () use ($lockHandle): void {
        if (is_resource($lockHandle)) {
            flock($lockHandle, LOCK_UN);
            fclose($lockHandle);
        }
    }
);

function logMessage(string $message): void
{
    $timestamp = date('Y-m-d H:i:s');
    $line = "[{$timestamp} Asia/Manila] {$message}" . PHP_EOL;

    file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}

function configValue(
    array $config,
    array $possibleKeys,
    ?string $constantName = null
): mixed {
    foreach ($possibleKeys as $key) {
        if (array_key_exists($key, $config)) {
            return $config[$key];
        }
    }

    if ($constantName !== null && defined($constantName)) {
        return constant($constantName);
    }

    return null;
}

function createDatabaseConnection(array $config): mysqli
{
    $host = configValue(
        $config,
        ['host', 'db_host', 'hostname'],
        'DB_HOST'
    );

    $user = configValue(
        $config,
        ['user', 'username', 'db_user'],
        'DB_USER'
    );

    $password = configValue(
        $config,
        ['password', 'pass', 'db_pass'],
        'DB_PASS'
    );

    $database = configValue(
        $config,
        ['database', 'dbname', 'db_name'],
        'DB_NAME'
    );

    $port = configValue(
        $config,
        ['port', 'db_port']
    );

    $port = $port !== null ? (int)$port : 3306;

    if (
        !is_string($host) ||
        !is_string($user) ||
        !is_string($password) ||
        !is_string($database) ||
        $host === '' ||
        $user === '' ||
        $database === ''
    ) {
        throw new RuntimeException(
            'The private database configuration is incomplete.'
        );
    }

    $mysqli = new mysqli(
        $host,
        $user,
        $password,
        $database,
        $port
    );

    if ($mysqli->connect_errno) {
        throw new RuntimeException(
            'Database connection failed: ' . $mysqli->connect_error
        );
    }

    if (!$mysqli->set_charset('utf8mb4')) {
        throw new RuntimeException(
            'Unable to set database character encoding.'
        );
    }

    return $mysqli;
}

function escapeHtml(string $value): string
{
    return htmlspecialchars(
        $value,
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8'
    );
}

function buildReminderHtml(string $name, int $numberOfGuests): string
{
    $safeName = escapeHtml($name);
    $guests   = max(1, $numberOfGuests);

    return
        '<!doctype html>' .
        '<html>' .
        '<body style="margin:0;padding:0;background:#090000;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">' .

        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#090000;">' .
        '<tr>' .
        '<td align="center" style="padding:28px 12px;">' .

        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#220000;border:1px solid #5d1717;border-radius:18px;overflow:hidden;">' .

        '<tr>' .
        '<td align="center" style="padding:36px 24px 30px;background:#1a0000;background-image:linear-gradient(135deg,#050000 0%,#5b0000 48%,#160000 100%);">' .

        '<img src="https://velzaglobal.com/Ph/Events/PR/Velza%20Logo%20-%201.png" alt="Velza Global" width="110" style="display:block;width:110px;max-width:100%;height:auto;margin:0 auto 24px;border:0;">' .

        '<div style="font-family:Georgia,Times New Roman,serif;font-size:29px;line-height:1.25;font-style:italic;color:#ffffff;margin:0 0 12px;">Exclusive Invitation</div>' .

        '<div style="width:72px;height:1px;background:#ffffff;margin:18px auto;"></div>' .

        '<div style="font-family:Georgia,Times New Roman,serif;font-size:13px;line-height:1.4;letter-spacing:4px;text-transform:uppercase;color:#f5dddd;">Event Reminder</div>' .

        '<h1 style="margin:14px 0 0;font-family:Georgia,Times New Roman,serif;font-size:30px;line-height:1.25;letter-spacing:1px;color:#ffffff;">Press Conference</h1>' .

        '</td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:32px 30px 18px;background:#170000;">' .

        '<p style="margin:0 0 16px;font-family:Georgia,Times New Roman,serif;font-size:19px;line-height:1.6;color:#ffffff;">Dear <strong>' .
        $safeName .
        '</strong>,</p>' .

        '<p style="margin:0;font-size:15px;line-height:1.8;color:#f4e8e8;">This is a friendly reminder of your confirmed attendance at the Velza Global Press Conference. We look forward to welcoming you.</p>' .

        '</td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:14px 30px 20px;background:#170000;">' .

        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#280404;border:1px solid #713333;border-radius:14px;">' .
        '<tr>' .
        '<td style="padding:25px;">' .

        '<div style="font-size:12px;line-height:1.4;letter-spacing:3px;text-transform:uppercase;color:#e7bcbc;margin-bottom:20px;">Event Details</div>' .

        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">' .

        '<tr>' .
        '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;width:90px;vertical-align:top;">Date</td>' .
        '<td style="padding:0 0 13px;font-family:Georgia,Times New Roman,serif;font-size:16px;color:#ffffff;">' .
        EVENT_DATE .
        '</td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;vertical-align:top;">Time</td>' .
        '<td style="padding:0 0 13px;font-family:Georgia,Times New Roman,serif;font-size:16px;color:#ffffff;">' .
        EVENT_TIME .
        '</td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;vertical-align:top;">Venue</td>' .
        '<td style="padding:0 0 13px;font-family:Georgia,Times New Roman,serif;font-size:16px;line-height:1.55;color:#ffffff;">' .
        EVENT_VENUE .
        '<br><span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e6cccc;">' .
        EVENT_ADDRESS .
        '</span></td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;vertical-align:top;">Attire</td>' .
        '<td style="padding:0 0 13px;font-size:15px;color:#ffffff;">Business Formals</td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;vertical-align:top;">Meal</td>' .
        '<td style="padding:0 0 13px;font-size:15px;color:#ffffff;">Artisan Plated Lunch</td>' .
        '</tr>' .

        '<tr>' .
        '<td style="padding:0;font-size:14px;color:#d9bcbc;vertical-align:top;">Guests</td>' .
        '<td style="padding:0;font-size:15px;color:#ffffff;">' .
        $guests .
        '</td>' .
        '</tr>' .

        '</table>' .
        '</td>' .
        '</tr>' .
        '</table>' .

        '</td>' .
        '</tr>' .

        '<tr>' .
        '<td align="center" style="padding:10px 30px 34px;background:#170000;">' .

        '<div style="width:72px;height:1px;background:#8f5454;margin:8px auto 22px;"></div>' .

        '<p style="margin:0 0 18px;font-size:14px;line-height:1.75;color:#efdede;">For assistance, contact<br><strong style="color:#ffffff;">Riza Perez Caba</strong><br><span style="color:#e9bcbc;">+63 953 315 5334</span></p>' .

        '<p style="margin:0;font-family:Georgia,Times New Roman,serif;font-size:15px;line-height:1.7;color:#ffffff;">Regards,<br><strong>Velza Global Philippines Events</strong></p>' .

        '</td>' .
        '</tr>' .

        '<tr>' .
        '<td align="center" style="padding:18px 24px;background:#080000;border-top:1px solid #411818;">' .
        '<p style="margin:0;font-size:11px;line-height:1.6;color:#a98282;">This is an automated event reminder from Velza Global Philippines.</p>' .
        '</td>' .
        '</tr>' .

        '</table>' .
        '</td>' .
        '</tr>' .
        '</table>' .

        '</body>' .
        '</html>';
}

function buildReminderText(string $name, int $numberOfGuests): string
{
    $guests = max(1, $numberOfGuests);

    return
        "Dear {$name},\n\n" .
        "This is a friendly reminder of your confirmed attendance at the " .
        EVENT_NAME .
        ". We look forward to welcoming you.\n\n" .
        EVENT_NAME . "\n" .
        EVENT_DATE . " at " . EVENT_TIME . "\n" .
        EVENT_VENUE . "\n" .
        EVENT_ADDRESS . "\n" .
        "Attire: Business Formals\n" .
        "Meal: Artisan Plated Lunch\n" .
        "Number of guests recorded: {$guests}\n\n" .
        "For assistance, contact Riza Perez Caba at +63 953 315 5334.\n\n" .
        "Velza Global Philippines Events";
}

function createMailer(array $smtpConfig): PHPMailer
{
    $requiredKeys = [
        'host',
        'username',
        'password',
        'port',
        'from_email',
        'from_name',
        'reply_to',
    ];

    foreach ($requiredKeys as $key) {
        if (
            !array_key_exists($key, $smtpConfig) ||
            trim((string)$smtpConfig[$key]) === ''
        ) {
            throw new RuntimeException(
                "Missing SMTP configuration value: {$key}"
            );
        }
    }

    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host       = (string)$smtpConfig['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = (string)$smtpConfig['username'];
    $mail->Password   = (string)$smtpConfig['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = (int)$smtpConfig['port'];
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 30;

    $mail->setFrom(
        (string)$smtpConfig['from_email'],
        (string)$smtpConfig['from_name']
    );

    $mail->addReplyTo(
        (string)$smtpConfig['reply_to'],
        (string)$smtpConfig['from_name']
    );

    $mail->isHTML(true);

    return $mail;
}

echo $sendMode
    ? "MODE: LIVE SEND\n"
    : "MODE: DRY RUN - NO EMAILS WILL SEND\n";

try {
    $mysqli = createDatabaseConnection($dbConfig);

    $sql = "
        SELECT
            id,
            name,
            email,
            num_people
        FROM registrations
        WHERE attendance = 'Yes'
          AND reminder_sent_at IS NULL
          AND email IS NOT NULL
          AND TRIM(email) <> ''
        ORDER BY id ASC
    ";

    $result = $mysqli->query($sql);

    if ($result === false) {
        throw new RuntimeException(
            'Reminder query failed: ' . $mysqli->error
        );
    }

    $registrations = [];

    while ($row = $result->fetch_assoc()) {
        $registrations[] = $row;
    }

    $result->free();

    echo 'ELIGIBLE: ' . count($registrations) . PHP_EOL;

    if ($registrations === []) {
        echo "Nothing to process.\n";
        $mysqli->close();
        exit(0);
    }

    $updateStatement = null;

    if ($sendMode) {
        $updateStatement = $mysqli->prepare(
            "
                UPDATE registrations
                SET reminder_sent_at = ?
                WHERE id = ?
                  AND reminder_sent_at IS NULL
            "
        );

        if ($updateStatement === false) {
            throw new RuntimeException(
                'Unable to prepare reminder update: ' . $mysqli->error
            );
        }
    }

    $sentCount   = 0;
    $failedCount = 0;

    foreach ($registrations as $registration) {
        $id         = (int)$registration['id'];
        $name       = trim((string)$registration['name']);
        $email      = trim((string)$registration['email']);
        $numPeople  = max(1, (int)$registration['num_people']);

        echo sprintf(
            "ID %d | %s | %s | Guests: %d",
            $id,
            $name,
            $email,
            $numPeople
        ) . PHP_EOL;

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $failedCount++;
            $message =
                "SKIPPED ID {$id}: invalid email address {$email}";

            echo $message . PHP_EOL;
            logMessage($message);
            continue;
        }

        if (!$sendMode) {
            continue;
        }

        try {
            $mail = createMailer($smtpConfig);

            $mail->addAddress($email, $name);
            $mail->Subject =
                'Event Reminder – Velza Global Press Conference';

            $mail->Body = buildReminderHtml(
                $name,
                $numPeople
            );

            $mail->AltBody = buildReminderText(
                $name,
                $numPeople
            );

            $mail->send();

            $sentAt = date('Y-m-d H:i:s');

            $updateStatement->bind_param(
                'si',
                $sentAt,
                $id
            );

            if (!$updateStatement->execute()) {
                throw new RuntimeException(
                    'Email sent, but reminder_sent_at could not be updated: ' .
                    $updateStatement->error
                );
            }

            if ($updateStatement->affected_rows !== 1) {
                throw new RuntimeException(
                    'Email sent, but the database row was not marked.'
                );
            }

            $sentCount++;

            $message =
                "SENT ID {$id} to {$email}; marked {$sentAt}";

            echo $message . PHP_EOL;
            logMessage($message);
        } catch (Throwable $emailError) {
            $failedCount++;

            $message =
                "FAILED ID {$id} to {$email}: " .
                $emailError->getMessage();

            echo $message . PHP_EOL;
            logMessage($message);
        }
    }

    if ($updateStatement instanceof mysqli_stmt) {
        $updateStatement->close();
    }

    $mysqli->close();

    if (!$sendMode) {
        echo "DRY_RUN_COMPLETE\n";
        echo "No database rows were changed.\n";
        exit(0);
    }

    echo "LIVE_SEND_COMPLETE\n";
    echo "SENT: {$sentCount}\n";
    echo "FAILED/SKIPPED: {$failedCount}\n";

    exit($failedCount > 0 ? 1 : 0);
} catch (Throwable $error) {
    $message = 'FATAL: ' . $error->getMessage();

    echo $message . PHP_EOL;
    logMessage($message);

    exit(1);
}
