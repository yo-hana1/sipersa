<?php
include_once 'config.php';

try {
    // Check if is_deleted exists in letter_requests
    $stmt = $conn->query("SHOW COLUMNS FROM letter_requests LIKE 'is_deleted'");
    if (!$stmt->fetch()) {
        $conn->exec("ALTER TABLE letter_requests ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
    }

    // Check if deleted_at exists in letter_requests
    $stmt = $conn->query("SHOW COLUMNS FROM letter_requests LIKE 'deleted_at'");
    if (!$stmt->fetch()) {
        $conn->exec("ALTER TABLE letter_requests ADD COLUMN deleted_at DATETIME DEFAULT NULL");
    }
    
    echo json_encode(["success" => true, "message" => "Database letter_requests updated successfully for soft delete."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
