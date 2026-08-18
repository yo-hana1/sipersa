<?php
require 'api/config.php';
$stmt = $conn->query("SELECT draft_data FROM letters_outgoing WHERE letter_number = 'PMN/Restu2/2026/04/30/1007'");
$res = $stmt->fetch(PDO::FETCH_ASSOC);
file_put_contents('test_output.txt', $res['draft_data']);
echo "Done";
?>
