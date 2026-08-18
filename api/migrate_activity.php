<?php
include_once 'config.php';

try {
    // Add last_activity and last_menu to users table
    $sql = "ALTER TABLE users 
            ADD COLUMN last_activity TIMESTAMP NULL DEFAULT NULL,
            ADD COLUMN last_menu VARCHAR(100) NULL DEFAULT NULL";
    
    $conn->exec($sql);
    echo json_encode(["success" => true, "message" => "Database updated: last_activity and last_menu columns added to users table."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Migration failed: " . $e->getMessage()]);
}
?>
