<?php
require 'api/config.php';
$stmt = $conn->query('SELECT draft_data FROM letters_outgoing WHERE draft_data IS NOT NULL ORDER BY id DESC LIMIT 1');
$res = $stmt->fetch(PDO::FETCH_ASSOC);
echo $res['draft_data'];
?>
