<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    $type = $_GET['type'] ?? 'logs';

    if ($type == 'users') {
        // Fetch active users status
        $query = "SELECT username, full_name, role, last_activity, last_menu 
                  FROM users 
                  ORDER BY last_activity DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } else {
        // Fetch activity logs
        $query = "SELECT al.*, u.username, u.full_name, u.role 
                  FROM activity_logs al 
                  LEFT JOIN users u ON al.user_id = u.id 
                  ORDER BY al.created_at DESC 
                  LIMIT 100";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    }

} elseif ($method == 'POST') {
    // Record new activity
    $data = json_decode(file_get_contents("php://input"));
    
    if (isset($data->user_id) && isset($data->action)) {
        $query = "INSERT INTO activity_logs (user_id, action, description) 
                  VALUES (:user_id, :action, :description)";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([
            ':user_id' => $data->user_id,
            ':action' => $data->action,
            ':description' => $data->description ?? ''
        ]);
        
        // Also update user's last activity
        if ($result) {
            $upd = "UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = :id";
            $st_upd = $conn->prepare($upd);
            $st_upd->execute([':id' => $data->user_id]);
        }
        
        echo json_encode(["success" => $result]);
    } else {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }

} elseif ($method == 'PUT') {
    // Update last menu / heartbeat
    $data = json_decode(file_get_contents("php://input"));
    
    if (isset($data->user_id)) {
        $query = "UPDATE users SET last_activity = CURRENT_TIMESTAMP, last_menu = :menu WHERE id = :id";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([
            ':menu' => $data->last_menu ?? null,
            ':id' => $data->user_id
        ]);
        echo json_encode(["success" => $result]);
    } else {
        echo json_encode(["success" => false, "message" => "Incomplete data"]);
    }
}
?>
