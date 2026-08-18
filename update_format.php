<?php
include_once 'api/config.php';

$update = $conn->prepare("UPDATE letter_templates SET number_format = 'PMN/Restu2/[YEAR]/[MM]/[DD]/[SEQ]' WHERE name = 'Surat Permohonan Narasumber'");
$update->execute();

echo "Format updated successfully.";
?>
