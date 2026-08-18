<?php
include_once 'config.php';

try {
    $conn->beginTransaction();

    // 1. Surat Permohonan Narasumber
    $stmt1 = $conn->prepare("UPDATE letter_templates SET number_format = 'PMN/Restu 2/[YEAR]/[MM]/[SEQ]' WHERE name LIKE '%Permohonan Narasumber%'");
    $stmt1->execute();

    // 2. Surat Undangan
    $stmt2 = $conn->prepare("UPDATE letter_templates SET number_format = 'UND/RESTU 2/[YEAR]/[MM]/[SEQ]' WHERE name LIKE '%Undangan%'");
    $stmt2->execute();

    // 3. Surat Peminjaman
    $stmt3 = $conn->prepare("UPDATE letter_templates SET number_format = 'PNJ/RESTU 2/[YEAR]/[MM]/[SEQ]' WHERE name LIKE '%Peminjaman%'");
    $stmt3->execute();

    $conn->commit();
    echo "Template formats updated successfully.";
} catch (Exception $e) {
    $conn->rollBack();
    echo "Error updating formats: " . $e->getMessage();
}
?>
