<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/bootstrap.php';

if (is_logged_in()) {
    redirect('/Ph/Events/PR/team/dashboard.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!verify_csrf_token($_POST['csrf_token'] ?? null)) {
        $error = 'Invalid security token. Please try again.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title><?= e(APP_NAME) ?> - Team Login</title>

<meta name="viewport" content="width=device-width, initial-scale=1">

<style>

body{
    margin:0;
    font-family:Arial,Helvetica,sans-serif;
    background:#f4f6f9;
}

.wrapper{
    width:380px;
    margin:80px auto;
}

.card{
    background:#fff;
    border-radius:8px;
    padding:30px;
    box-shadow:0 2px 10px rgba(0,0,0,.12);
}

h1{
    margin-top:0;
    text-align:center;
    font-size:24px;
}

label{
    display:block;
    margin-top:15px;
    font-weight:bold;
}

input[type=email],
input[type=password]{
    width:100%;
    padding:10px;
    box-sizing:border-box;
    margin-top:5px;
}

button{
    width:100%;
    margin-top:20px;
    padding:12px;
    cursor:pointer;
    font-size:16px;
}

.error{
    background:#ffe5e5;
    color:#b00020;
    padding:10px;
    border-radius:4px;
    margin-bottom:15px;
}

.footer{
    margin-top:15px;
    text-align:center;
    color:#777;
    font-size:12px;
}

</style>

</head>

<body>

<div class="wrapper">

<div class="card">

<h1>Team Portal</h1>

<?php if ($error !== ''): ?>

<div class="error">
<?= e($error) ?>
</div>

<?php endif; ?>

<form method="post" autocomplete="off">

<?= csrf_field() ?>

<label>Email Address</label>

<input
type="email"
name="email"
required
maxlength="255">

<label>Password</label>

<input
type="password"
name="password"
required>

<button type="submit">
Sign In
</button>

</form>

<div class="footer">

<?= e(APP_NAME) ?>

<br>

Version <?= e(APP_VERSION) ?>

</div>

</div>

</div>

</body>
</html>