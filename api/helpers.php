<?php
function recordActivity($conn, $user_id, $action, $description = '') {
    try {
        $query = "INSERT INTO activity_logs (user_id, action, description) VALUES (:user_id, :action, :description)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':user_id' => $user_id,
            ':action' => $action,
            ':description' => $description
        ]);
        
        // Update users last_activity
        $upd = "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = :id";
        $st_upd = $conn->prepare($upd);
        $st_upd->execute([':id' => $user_id]);
        
        return true;
    } catch (Exception $e) {
        return false;
    }
}
?>
