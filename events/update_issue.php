<?php
// update_issue.php
$dbConfig = require '/home/velzhsrg/private_config/rsvp_db.php';

header('Content-Type: application/json');

$id = intval($_POST['id'] ?? 0);
if(!$id){
    echo json_encode(['success'=>false,'error'=>'missing id']);
    exit;
}

$mysqli = new mysqli(
    (string)$dbConfig['host'],
    (string)$dbConfig['username'],
    (string)$dbConfig['password'],
    (string)$dbConfig['database']
);
if ($mysqli->connect_errno) {
    echo json_encode(['success'=>false,'error'=>'db connect error']);
    exit;
}

// get current issued value
$cur = $mysqli->query("SELECT issued FROM registrations WHERE id = " . $id);
if(!$cur || $cur->num_rows === 0){
    echo json_encode(['success'=>false,'error'=>'not found']);
    exit;
}
$r = $cur->fetch_assoc();
$new = $r['issued'] ? 0 : 1;

$stmt = $mysqli->prepare("UPDATE registrations SET issued = ? WHERE id = ?");
$stmt->bind_param('ii', $new, $id);
if($stmt->execute()){
    echo json_encode(['success'=>true,'issued'=> (bool)$new]);
} else {
    echo json_encode(['success'=>false,'error'=>$stmt->error]);
}
$stmt->close();
$mysqli->close();
