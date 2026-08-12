<?php
declare(strict_types=1);

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

date_default_timezone_set('Asia/Manila');

error_log(
    'RSVP submit.php reached: method=' .
    ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN') .
    ', post_keys=' .
    implode(',', array_keys($_POST))
);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ./');
    exit;
}

$dbConfig = require '/home/velzhsrg/private_config/rsvp_db.php';
$smtpConfig = require '/home/velzhsrg/private_config/rsvp_smtp.php';

function redirectFailure(string $reason = '0'): void
{
    header('Location: ./?success=' . rawurlencode($reason));
    exit;
}

function connectDatabase(array $config): mysqli
{
    $requiredKeys = ['host', 'username', 'password', 'database'];

    foreach ($requiredKeys as $key) {
        if (!array_key_exists($key, $config)) {
            throw new RuntimeException(
                'Missing database configuration key: ' . $key
            );
        }
    }

    $mysqli = new mysqli(
        (string)$config['host'],
        (string)$config['username'],
        (string)$config['password'],
        (string)$config['database']
    );

    if ($mysqli->connect_errno) {
        throw new RuntimeException('Database connection failed.');
    }

    if (!$mysqli->set_charset('utf8mb4')) {
        throw new RuntimeException('Could not set database character set.');
    }

    return $mysqli;
}

function postText(string $key): string
{
    return trim((string)($_POST[$key] ?? ''));
}

function postConsent(string $key): int
{
    return isset($_POST[$key]) ? 1 : 0;
}

$attendeeType       = postText('attendee_type');
$name               = postText('name');
$email              = strtolower(postText('email'));
$contact            = postText('contact');
$invitedBy          = postText('invited_by');
$attendance         = postText('attendance');
$additionalRequest  = postText('additional_request');
$emergencyPerson    = postText('emergency_person');
$emergencyContact   = postText('emergency_contact');

$mediaName          = postText('media_name');
$mediaPrimaryFocus  = postText('media_primary_focus');
$mediaCompanyName   = postText('media_company_name');
$mediaFocusOther    = postText('media_focus_other');

$numPeopleRaw = postText('num_people');
$numPeople = filter_var(
    $numPeopleRaw,
    FILTER_VALIDATE_INT,
    [
        'options' => [
            'min_range' => 1,
            'max_range' => 20,
        ],
    ]
);

$consentAccuracy         = postConsent('consent_accuracy');
$consentPrivacy          = postConsent('consent_privacy');
$consentInvitation       = postConsent('consent_invitation');
$consentAdmission        = postConsent('consent_admission');
$consentMediaAffiliation = postConsent('consent_media_affiliation');
$marketingConsent        = postConsent('marketing_consent');

$allowedAttendeeTypes = ['Guest', 'Media'];
$allowedAttendance = ['Yes', 'No'];
$allowedMediaFocus = ['Print', 'Digital', 'Radio', 'Others'];

$invalid =
    !in_array($attendeeType, $allowedAttendeeTypes, true) ||
    $name === '' ||
    mb_strlen($name) > 255 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    mb_strlen($email) > 255 ||
    !preg_match('/^\d{10}$/', $contact) ||
    $invitedBy === '' ||
    mb_strlen($invitedBy) > 255 ||
    !in_array($attendance, $allowedAttendance, true) ||
    $numPeople === false ||
    mb_strlen($additionalRequest) > 2000 ||
    $emergencyPerson === '' ||
    mb_strlen($emergencyPerson) > 255 ||
    !preg_match('/^\d{10}$/', $emergencyContact) ||
    $consentAccuracy !== 1 ||
    $consentPrivacy !== 1 ||
    $consentInvitation !== 1 ||
    $consentAdmission !== 1;

if ($attendeeType === 'Media') {
    $invalid =
        $invalid ||
        $mediaName === '' ||
        mb_strlen($mediaName) > 255 ||
        !in_array($mediaPrimaryFocus, $allowedMediaFocus, true) ||
        $mediaCompanyName === '' ||
        mb_strlen($mediaCompanyName) > 255 ||
        $consentMediaAffiliation !== 1;

    if ($mediaPrimaryFocus === 'Others') {
        $invalid =
            $invalid ||
            $mediaFocusOther === '' ||
            mb_strlen($mediaFocusOther) > 255;
    }
} else {
    $mediaName = '';
    $mediaPrimaryFocus = '';
    $mediaCompanyName = '';
    $mediaFocusOther = '';
    $consentMediaAffiliation = 0;
}

if ($invalid) {
    error_log(
        'RSVP validation rejected: ' .
        json_encode(
            [
                'post_keys' => array_keys($_POST),
                'attendee_type' => $attendeeType,
                'name_present' => $name !== '',
                'email_valid' => filter_var(
                    $email,
                    FILTER_VALIDATE_EMAIL
                ) !== false,
                'contact' => $contact,
                'invited_by_present' => $invitedBy !== '',
                'attendance' => $attendance,
                'num_people_raw' => $numPeopleRaw,
                'emergency_person_present' =>
                    $emergencyPerson !== '',
                'emergency_contact' => $emergencyContact,
                'consent_accuracy' => $consentAccuracy,
                'consent_privacy' => $consentPrivacy,
                'consent_invitation' => $consentInvitation,
                'consent_admission' => $consentAdmission,
                'consent_media_affiliation' =>
                    $consentMediaAffiliation,
                'marketing_consent' => $marketingConsent,
            ],
            JSON_UNESCAPED_SLASHES
        )
    );

    redirectFailure('0');
}

/*
 * Preserve the legacy industry column for existing reports and exports.
 */
$industry = $attendeeType === 'Media' ? 'Press/Media' : 'Guest';

$now = new DateTimeImmutable(
    'now',
    new DateTimeZone('Asia/Manila')
);

/*
 * Registration timeline (Asia/Manila)
 */
$reminderCutoff = new DateTimeImmutable(
    '2026-08-02 11:00:00',
    new DateTimeZone('Asia/Manila')
);

$onsiteStart = new DateTimeImmutable(
    '2026-08-04 11:00:00',
    new DateTimeZone('Asia/Manila')
);

$registrationClose = new DateTimeImmutable(
    '2026-08-04 12:30:00',
    new DateTimeZone('Asia/Manila')
);

if ($now >= $registrationClose) {
    redirectFailure('3');
}

if ($now < $reminderCutoff) {
    $registrationMode = 'normal';
} elseif ($now < $onsiteStart) {
    $registrationMode = 'final_reminder';
} else {
    $registrationMode = 'onsite';
}

$createdAt = $now->format('Y-m-d H:i:s');
$consentedAt = $createdAt;

$mysqli = null;
$stmt = null;

try {
    $mysqli = connectDatabase($dbConfig);
    $mysqli->begin_transaction();

    /*
     * Duplicate protection:
     * the same email address or mobile number cannot register twice.
     */
    $duplicateStmt = $mysqli->prepare(
        'SELECT id
         FROM registrations
         WHERE LOWER(email) = LOWER(?)
            OR contact = ?
         LIMIT 1
         FOR UPDATE'
    );

    if (!$duplicateStmt) {
        throw new RuntimeException('Duplicate-check preparation failed.');
    }

    $duplicateStmt->bind_param('ss', $email, $contact);
    $duplicateStmt->execute();
    $duplicateResult = $duplicateStmt->get_result();

    if ($duplicateResult->fetch_assoc()) {
        $duplicateStmt->close();
        $mysqli->rollback();
        $mysqli->close();
        redirectFailure('2');
    }

    $duplicateStmt->close();

    /*
     * Lock and advance the correct Guest or Media sequence.
     */
    $sequenceStmt = $mysqli->prepare(
        'SELECT last_number
         FROM rsvp_sequences
         WHERE attendee_type = ?
         FOR UPDATE'
    );

    if (!$sequenceStmt) {
        throw new RuntimeException('Sequence preparation failed.');
    }

    $sequenceStmt->bind_param('s', $attendeeType);
    $sequenceStmt->execute();
    $sequenceResult = $sequenceStmt->get_result();
    $sequenceRow = $sequenceResult->fetch_assoc();

    if (!$sequenceRow) {
        throw new RuntimeException('RSVP sequence row was not found.');
    }

    $nextNumber = ((int)$sequenceRow['last_number']) + 1;
    $sequenceStmt->close();

    $updateSequenceStmt = $mysqli->prepare(
        'UPDATE rsvp_sequences
         SET last_number = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE attendee_type = ?'
    );

    if (!$updateSequenceStmt) {
        throw new RuntimeException('Sequence update preparation failed.');
    }

    $updateSequenceStmt->bind_param(
        'is',
        $nextNumber,
        $attendeeType
    );

    if (!$updateSequenceStmt->execute()) {
        throw new RuntimeException('Could not update RSVP sequence.');
    }

    $updateSequenceStmt->close();

    $typeCode = $attendeeType === 'Media' ? 'M' : 'G';

    $rsvpId = sprintf(
        'VGPH-2026-PC-%s%05d',
        $typeCode,
        $nextNumber
    );

    $approvalStatus = 'Approved';
    $issued = 'No';
    $reminderSentAt = $registrationMode === 'normal'
        ? ''
        : $createdAt;

    $stmt = $mysqli->prepare(
        'INSERT INTO registrations
        (
            attendee_type,
            rsvp_id,
            approval_status,
            name,
            industry,
            media_name,
            media_primary_focus,
            media_company_name,
            media_focus_other,
            email,
            contact,
            invited_by,
            attendance,
            num_people,
            additional_request,
            emergency_person,
            emergency_contact,
            consent_accuracy,
            consent_privacy,
            consent_invitation,
            consent_admission,
            consent_media_affiliation,
            marketing_consent,
            consented_at,
            issued,
            reminder_sent_at,
            created_at
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, NULLIF(?, \'\'), ?, NULLIF(?, \'\'),
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, NULLIF(?, \'\'), ?
        )'
    );

    if (!$stmt) {
        throw new RuntimeException('Registration preparation failed.');
    }

    $stmt->bind_param(
        'sssssssssssssisssiiiiiissss',
        $attendeeType,
        $rsvpId,
        $approvalStatus,
        $name,
        $industry,
        $mediaName,
        $mediaPrimaryFocus,
        $mediaCompanyName,
        $mediaFocusOther,
        $email,
        $contact,
        $invitedBy,
        $attendance,
        $numPeople,
        $additionalRequest,
        $emergencyPerson,
        $emergencyContact,
        $consentAccuracy,
        $consentPrivacy,
        $consentInvitation,
        $consentAdmission,
        $consentMediaAffiliation,
        $marketingConsent,
        $consentedAt,
        $issued,
        $reminderSentAt,
        $createdAt
    );

    if (!$stmt->execute()) {
        throw new RuntimeException('Registration insert failed.');
    }

    $registrationId = (int)$stmt->insert_id;

    $stmt->close();
    $stmt = null;

    $mysqli->commit();
    $mysqli->close();
    $mysqli = null;

    // The RSVP is already saved. Email failure must not cancel registration.
    try {
        $mail = new PHPMailer(true);


        $mail->isSMTP();
        $mail->Host       = $smtpConfig['host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtpConfig['username'];
        $mail->Password   = $smtpConfig['password'];
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = (int)$smtpConfig['port'];
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom(
            $smtpConfig['from_email'],
            $smtpConfig['from_name']
        );

        $mail->addReplyTo(
            $smtpConfig['reply_to'],
            $smtpConfig['from_name']
        );

        // Internal RSVP notification
        $mail->addAddress(
            'events@velzaglobal.ph',
            'Velza Global Philippines Events'
        );

        $mail->isHTML(true);
        $mail->Subject = 'New RSVP – ' . $rsvpId . ' – ' . $name;

        $safeRsvpId     = htmlspecialchars($rsvpId, ENT_QUOTES, 'UTF-8');
        $safeAttendeeType = htmlspecialchars(
            $attendeeType,
            ENT_QUOTES,
            'UTF-8'
        );
        $safeName       = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeIndustry   = htmlspecialchars((string)($industry ?? ''), ENT_QUOTES, 'UTF-8');
        $safeMediaName  = htmlspecialchars(
            $mediaName !== '' ? $mediaName : 'Not applicable',
            ENT_QUOTES,
            'UTF-8'
        );
        $safeMediaFocus = htmlspecialchars(
            $mediaPrimaryFocus !== '' ? $mediaPrimaryFocus : 'Not applicable',
            ENT_QUOTES,
            'UTF-8'
        );
        $safeMediaCompany = htmlspecialchars(
            $mediaCompanyName !== '' ? $mediaCompanyName : 'Not applicable',
            ENT_QUOTES,
            'UTF-8'
        );
        $safeMediaOther = htmlspecialchars(
            $mediaFocusOther !== '' ? $mediaFocusOther : 'Not applicable',
            ENT_QUOTES,
            'UTF-8'
        );
        $safeEmail      = htmlspecialchars((string)($email ?? ''), ENT_QUOTES, 'UTF-8');
        $safeContact    = htmlspecialchars((string)($contact ?? ''), ENT_QUOTES, 'UTF-8');
        $safeInvitedBy  = htmlspecialchars((string)($invitedBy ?? ''), ENT_QUOTES, 'UTF-8');
        $safeAttendance = htmlspecialchars((string)($attendance ?? ''), ENT_QUOTES, 'UTF-8');
        $safeRequest    = htmlspecialchars(
            $additionalRequest !== '' ? $additionalRequest : 'None',
            ENT_QUOTES,
            'UTF-8'
        );

        $mail->Body =
            '<h2>New RSVP Registration</h2>' .
            '<p><strong>RSVP ID:</strong> ' . $safeRsvpId . '</p>' .
            '<p><strong>Attendee type:</strong> ' . $safeAttendeeType . '</p>' .
            '<p><strong>Name:</strong> ' . $safeName . '</p>' .
            '<p><strong>Category:</strong> ' . $safeIndustry . '</p>' .
            ($attendeeType === 'Media'
                ? '<p><strong>Media representative:</strong> ' .
                    $safeMediaName . '</p>' .
                  '<p><strong>Media focus:</strong> ' .
                    $safeMediaFocus . '</p>' .
                  '<p><strong>Media company:</strong> ' .
                    $safeMediaCompany . '</p>' .
                  ($mediaPrimaryFocus === 'Others'
                      ? '<p><strong>Other focus:</strong> ' .
                        $safeMediaOther . '</p>'
                      : '')
                : '') .
            '<p><strong>Email:</strong> ' . $safeEmail . '</p>' .
            '<p><strong>Contact:</strong> ' . $safeContact . '</p>' .
            '<p><strong>Velza Host:</strong> ' . $safeInvitedBy . '</p>' .
            '<p><strong>Attendance:</strong> ' . $safeAttendance . '</p>' .
            '<p><strong>Total guests:</strong> ' . (int)$numPeople . '</p>' .
            '<p><strong>Additional request:</strong> ' . $safeRequest . '</p>' .
            '<p><strong>Submitted:</strong> ' .
            htmlspecialchars($createdAt, ENT_QUOTES, 'UTF-8') .
            ' Asia/Manila</p>';

        $mail->AltBody =
            "New RSVP Registration\n" .
            "RSVP ID: {$rsvpId}\n" .
            "Attendee type: {$attendeeType}\n" .
            "Name: {$name}\n" .
            "Category: {$industry}\n" .
            ($attendeeType === 'Media'
                ? "Media representative: {$mediaName}\n" .
                  "Media focus: {$mediaPrimaryFocus}\n" .
                  "Media company: {$mediaCompanyName}\n" .
                  ($mediaPrimaryFocus === 'Others'
                      ? "Other focus: {$mediaFocusOther}\n"
                      : '')
                : '') .
            "Email: {$email}\n" .
            "Contact: {$contact}\n" .
            "Velza Host: {$invitedBy}\n" .
            "Attendance: {$attendance}\n" .
            "Total guests: {$numPeople}\n" .
            "Additional request: " .
            ($additionalRequest !== '' ? $additionalRequest : 'None') .
            "\nSubmitted: {$createdAt} Asia/Manila";

        $mail->send();

        // Guest confirmation
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $mail->clearAddresses();
            $mail->clearAttachments();

            $mail->addAddress($email, $name);
            $mail->Subject = 'RSVP Confirmation – Velza Global Press Conference';

            $attendanceMessage = $attendance === 'Yes'
                ? 'We are pleased to confirm your attendance.'
                : 'We have recorded that you will not be attending.';

            $emailLabel = 'RSVP Confirmation';
            $emailIntro = 'Thank you for responding to our invitation. ' .
                $attendanceMessage;

            if (
                $registrationMode === 'final_reminder' &&
                $attendance === 'Yes'
            ) {
                $emailLabel = 'RSVP Confirmation & Event Reminder';
                $emailIntro =
                    'Your registration is confirmed. This is also a friendly ' .
                    'reminder of your confirmed attendance at the Velza Global ' .
                    'Press Conference. We look forward to welcoming you.';
            } elseif ($registrationMode === 'onsite') {
                $emailLabel = 'On-Site RSVP Confirmation';
                $emailIntro =
                    'Your on-site registration has been confirmed. ' .
                    $attendanceMessage;
            }

            $mail->Body =
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

                '<div style="font-family:Georgia,Times New Roman,serif;font-size:13px;line-height:1.4;letter-spacing:4px;text-transform:uppercase;color:#f5dddd;">' .
                htmlspecialchars($emailLabel, ENT_QUOTES, 'UTF-8') .
                '</div>' .

                '<h1 style="margin:14px 0 0;font-family:Georgia,Times New Roman,serif;font-size:30px;line-height:1.25;letter-spacing:1px;color:#ffffff;">Press Conference</h1>' .

                '</td>' .
                '</tr>' .

                '<tr>' .
                '<td style="padding:32px 30px 18px;background:#170000;">' .

                '<p style="margin:0 0 16px;font-family:Georgia,Times New Roman,serif;font-size:19px;line-height:1.6;color:#ffffff;">Dear <strong>' . $safeName . '</strong>,</p>' .

                '<p style="margin:0 0 14px;font-size:15px;line-height:1.8;color:#f4e8e8;">' .
                htmlspecialchars($emailIntro, ENT_QUOTES, 'UTF-8') .
                '</p>' .

                '<p style="margin:0;font-size:15px;line-height:1.8;color:#ffffff;"><strong>RSVP ID:</strong> ' .
                $safeRsvpId .
                '</p>' .

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
                '<td style="padding:0 0 13px;font-family:Georgia,Times New Roman,serif;font-size:16px;color:#ffffff;">Tuesday, 4 August 2026</td>' .
                '</tr>' .

                '<tr>' .
                '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;vertical-align:top;">Time</td>' .
                '<td style="padding:0 0 13px;font-family:Georgia,Times New Roman,serif;font-size:16px;color:#ffffff;">11:00 AM</td>' .
                '</tr>' .

                '<tr>' .
                '<td style="padding:0 0 13px;font-size:14px;color:#d9bcbc;vertical-align:top;">Venue</td>' .
                '<td style="padding:0 0 13px;font-family:Georgia,Times New Roman,serif;font-size:16px;line-height:1.55;color:#ffffff;">WERCO Complex<br><span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#e6cccc;">1700 Dr. A. Santos Avenue, San Antonio, Parañaque City, Metro Manila</span></td>' .
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
                '<td style="padding:0;font-size:15px;color:#ffffff;">' . (int)$numPeople . '</td>' .
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
                '<p style="margin:0;font-size:11px;line-height:1.6;color:#a98282;">This is an automated RSVP confirmation from Velza Global Philippines.</p>' .
                '</td>' .
                '</tr>' .

                '</table>' .
                '</td>' .
                '</tr>' .
                '</table>' .

                '</body>' .
                '</html>';

            $mail->AltBody =
                "Dear {$name},\n\n" .
                $emailIntro . "\n" .
                "RSVP ID: {$rsvpId}\n\n" .
                "Velza Global Press Conference\n" .
                "Tuesday, 4 August 2026 at 11:00 AM\n" .
                "WERCO Complex\n" .
                "1700 Dr. A. Santos Avenue, San Antonio, Parañaque City, Metro Manila\n" .
                "Attire: Business Formals\n" .
                "Meal: Artisan Plated Lunch\n" .
                "Number of guests recorded: {$numPeople}\n\n" .
                "For assistance, contact Riza Perez Caba at +63 953 315 5334.\n\n" .
                "Velza Global Philippines Events";

            $mail->send();
        }
    } catch (\Throwable $emailError) {
        error_log(
            'RSVP email failed for ' .
            $rsvpId .
            ': ' .
            $emailError->getMessage()
        );
    }


    header('Location: ./?success=1');
    exit;
} catch (Throwable $error) {
    if ($stmt instanceof mysqli_stmt) {
        $stmt->close();
    }

    if ($mysqli instanceof mysqli) {
        try {
            $mysqli->rollback();
        } catch (Throwable $rollbackError) {
            error_log(
                'RSVP rollback failed: ' .
                $rollbackError->getMessage()
            );
        }

        $mysqli->close();
    }

    error_log(
        'RSVP submission failed: ' .
        $error->getMessage()
    );

    redirectFailure('0');
}