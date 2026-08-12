<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Always use Manila timezone
date_default_timezone_set('Asia/Manila');

// Get CURRENT PHILIPPINES TIME
$currentPHTime = date("F d, Y • h:i A");


// DB CONNECT
$dbConfig = require '/home/velzhsrg/private_config/rsvp_db.php';

$conn = new mysqli(
    (string)$dbConfig['host'],
    (string)$dbConfig['username'],
    (string)$dbConfig['password'],
    (string)$dbConfig['database']
);

if ($conn->connect_error) {
    die("Database connection failed.");
}


// -------------------------------------------------------------------
// UPDATE ISSUED STATUS (AJAX toggle)
// -------------------------------------------------------------------
if (isset($_GET['toggle'])) {

    $id = intval($_GET['id']);

    $q = $conn->prepare("SELECT issued FROM registrations WHERE id = ?");
    $q->bind_param("i", $id);
    $q->execute();
    $res = $q->get_result()->fetch_assoc();
    $q->close();

    if (!$res) exit("INVALID");

    if ($res['issued'] === "Yes") exit("LOCKED");

    $new = "Yes";
    $u = $conn->prepare("UPDATE registrations SET issued=? WHERE id=?");
    $u->bind_param("si", $new, $id);
    $u->execute();
    $u->close();

    exit("UPDATED");
}


// -------------------------------------------------------------------
// AJAX TABLE + PAGINATION
// -------------------------------------------------------------------
if (isset($_GET['load'])) {

    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    if ($page < 1) $page = 1;

    $limit  = 10;
    $offset = ($page - 1) * $limit;

    // Count rows
    $count_row = $conn->query("SELECT COUNT(*) AS total FROM registrations")->fetch_assoc();
    $count = (int)($count_row['total'] ?? 0);
    $total_pages = max(1, ceil($count / 10));

    // Fetch records
    $result = $conn->query("
        SELECT * FROM registrations 
        ORDER BY id DESC 
        LIMIT $limit OFFSET $offset
    ");

    echo '<table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Guest / Media</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Emergency Person Name</th>
                <th>Emergency Contact Number</th>
                <th>Total No. of Guest</th>
                <th>Date &amp; Time (Philippines)</th>
                <th>ID Issued</th>
            </tr>';

    while ($r = $result->fetch_assoc()) {

        // Toggle switch
        if ($r["issued"] === "Yes") {
            $toggle = '
                <label class="switch locked">
                    <input type="checkbox" checked disabled>
                    <span class="slider round"></span>
                </label>
                <span class="green-check">&#10004;</span>';
        } else {
            $toggle = '
                <label class="switch">
                    <input type="checkbox" onchange="toggleIssued(' . $r["id"] . ')">
                    <span class="slider round"></span>
                </label>';
        }

        // Clean values
        $id   = (int)$r['id'];
        $name = htmlspecialchars($r['name']);
        $gm   = htmlspecialchars($r['industry']); // Guest / Media
        $email= htmlspecialchars($r['email']);
        $contact = htmlspecialchars($r['contact']);
        $emName  = htmlspecialchars($r['emergency_person']);
        $emNum   = htmlspecialchars($r['emergency_contact']);
        $num     = (int)$r['num_people'];

        // Format TIMESTAMP exactly as stored
        $raw = $r['created_at'];
        $ts = strtotime($raw);

        if ($ts !== false) {
            $date_display = date("F d, Y • h:i A", $ts) . " (Philippines)";
        } else {
            $date_display = $raw . " (Philippines)";
        }

        echo "
        <tr>
            <td>{$id}</td>
            <td>{$name}</td>
            <td>{$gm}</td>
            <td>{$email}</td>
            <td>{$contact}</td>
            <td>{$emName}</td>
            <td>{$emNum}</td>
            <td>{$num}</td>
            <td>{$date_display}</td>
            <td>{$toggle}</td>
        </tr>";
    }

    echo '</table>';

    // Pagination
    echo "<div style='margin-top:15px;text-align:center;'>";
    for ($i = 1; $i <= $total_pages; $i++) {
        $active = ($i == $page) ? "style='font-weight:bold'" : "";
        echo "<button onclick='goToPage($i)' $active>$i</button> ";
    }
    echo "</div>";

    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Live Registrations – Admin Panel</title>

<style>
body { font-family: Arial, sans-serif; background:#f6f6f6; padding:20px; }

table { width:100%; border-collapse:collapse; background:white; box-shadow:0 0 10px #ccc; }
th,td { padding:12px; border:1px solid #ddd; }
th { background:black; color:white; }

.switch { position:relative; display:inline-block; width:50px; height:24px; }
.switch input { display:none; }
.slider { position:absolute; cursor:pointer; background:#ccc; inset:0; border-radius:34px; transition:.4s; }
.slider:before { position:absolute; content:""; width:18px; height:18px; left:3px; bottom:3px; background:white; border-radius:50%; transition:.4s; }
input:checked + .slider { background:#4CAF50; }
input:checked + .slider:before { transform:translateX(26px); }

.green-check { margin-left:6px; color:green; font-size:20px; }
.locked { opacity:0.6; cursor:not-allowed; }
button{ padding:6px 12px; }
</style>

<script>
let currentPage = 1;

function loadTable(){
    const x = new XMLHttpRequest();
    x.open("GET", "host_view.php?load=1&page="+currentPage, true);
    x.onload = () => document.getElementById("live").innerHTML = x.responseText;
    x.send();
}

function goToPage(p){ currentPage = p; loadTable(); }

function toggleIssued(id){
    if(!confirm("Mark ID as issued? This cannot be undone.")) return;

    const x = new XMLHttpRequest();
    x.open("GET", "host_view.php?toggle=1&id="+id, true);
    x.onload = () => loadTable();
    x.send();
}

setInterval(loadTable, 3000);
window.onload = loadTable;
</script>

</head>
<body>

<h2>Live Registrations – Admin Panel</h2>

<p><strong>Current Time (Philippines):</strong> <?= $currentPHTime ?></p>

<div id="live">Loading...</div>

</body>
</html>
