<?php
include_once 'config.php';

try {
    $conn->exec("ALTER TABLE letters_outgoing ADD COLUMN IF NOT EXISTS template_id INT DEFAULT NULL");
    $conn->exec("ALTER TABLE letters_outgoing ADD COLUMN IF NOT EXISTS request_id INT DEFAULT NULL");
    $conn->exec("ALTER TABLE letters_outgoing ADD COLUMN IF NOT EXISTS draft_data TEXT DEFAULT NULL");
    $conn->exec("ALTER TABLE letters_outgoing MODIFY COLUMN date_sent DATE NULL");
    $conn->exec("ALTER TABLE letters_outgoing MODIFY COLUMN letter_number VARCHAR(50) NULL");

    echo json_encode(["success" => true, "message" => "Database migrated successfully"]);
} catch (PDOException $e) {
    // If ADD COLUMN IF NOT EXISTS is not supported (MySQL < 8.0.19), we handle errors manually
    if ($e->getCode() == '42S21') { // Column already exists
        echo json_encode(["success" => true, "message" => "Columns already exist"]);
    } else {
        // Fallback: Try adding columns one by one ignoring "already exists" errors
        $columns = [
            "template_id INT DEFAULT NULL",
            "request_id INT DEFAULT NULL",
            "draft_data TEXT DEFAULT NULL"
        ];
        foreach ($columns as $col) {
            try {
                $conn->exec("ALTER TABLE letters_outgoing ADD COLUMN $col");
            } catch (PDOException $ex) {}
        }
        $conn->exec("ALTER TABLE letters_outgoing MODIFY COLUMN date_sent DATE NULL");
        $conn->exec("ALTER TABLE letters_outgoing MODIFY COLUMN letter_number VARCHAR(50) NULL");
        
        echo json_encode(["success" => true, "message" => "Migration finished (with manual handling)"]);
    }
}
?>
