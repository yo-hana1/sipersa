<?php
include_once 'config.php';
$stmt = $conn->prepare("DESCRIBE letters_outgoing");
$stmt->execute();
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($columns);
?>
