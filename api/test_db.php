<?php
include_once 'config.php';
$stmt = $conn->query("SELECT * FROM letter_templates");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
