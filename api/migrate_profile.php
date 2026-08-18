<?php
include_once 'config.php';

try {
    // Add profile_picture column to users table
    $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) DEFAULT NULL");
    
    echo json_encode(["success" => true, "message" => "Database migrated successfully for profile_picture"]);
} catch (PDOException $e) {
    // If ADD COLUMN IF NOT EXISTS is not supported (MySQL < 8.0.19)
    if ($e->getCode() == '42S21') { // Column already exists
        echo json_encode(["success" => true, "message" => "Column profile_picture already exists"]);
    } else {
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL");
            echo json_encode(["success" => true, "message" => "Migration finished (with manual handling)"]);
        } catch (PDOException $ex) {
             echo json_encode(["success" => false, "message" => "Error: " . $ex->getMessage()]);
        }
    }
}
?>
