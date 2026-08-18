<?php
include_once 'config.php';

try {
    // Check if is_deleted exists
    $stmt = $conn->query("SHOW COLUMNS FROM letters_incoming LIKE 'is_deleted'");
    if (!$stmt->fetch()) {
        $conn->exec("ALTER TABLE letters_incoming ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
    }

    // Check if deleted_at exists
    $stmt = $conn->query("SHOW COLUMNS FROM letters_incoming LIKE 'deleted_at'");
    if (!$stmt->fetch()) {
        $conn->exec("ALTER TABLE letters_incoming ADD COLUMN deleted_at DATETIME DEFAULT NULL");
    }
    
    echo json_encode(["success" => true, "message" => "Database letters_incoming updated successfully for soft delete."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
