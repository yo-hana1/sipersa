<?php
include_once 'config.php';

try {
    $conn->beginTransaction();

    // 1. Add is_deleted column if not exists
    $checkCol = $conn->query("SHOW COLUMNS FROM kategori_surat LIKE 'is_deleted'");
    if ($checkCol->rowCount() == 0) {
        $conn->exec("ALTER TABLE kategori_surat ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 AFTER deskripsi");
        echo "Added 'is_deleted' to table 'kategori_surat'.<br>";
    }

    // 2. Add deleted_at column if not exists
    $checkCol = $conn->query("SHOW COLUMNS FROM kategori_surat LIKE 'deleted_at'");
    if ($checkCol->rowCount() == 0) {
        $conn->exec("ALTER TABLE kategori_surat ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER is_deleted");
        echo "Added 'deleted_at' to table 'kategori_surat'.<br>";
    }

    $conn->commit();
    echo "Migration V2 completed successfully.";

} catch (Exception $e) {
    $conn->rollBack();
    echo "Error: " . $e->getMessage();
}
?>
