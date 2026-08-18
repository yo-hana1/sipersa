<?php
include_once 'config.php';
$data = [
    "letter_number" => "TEST/001",
    "recipient" => "Test Recipient",
    "subject" => "Test Subject",
    "status" => "Draft",
    "template_id" => 1
];

$ch = curl_init('http://localhost/siarsad/api/surat_keluar.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>
