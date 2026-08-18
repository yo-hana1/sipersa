<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper function to create notification
function createNotification($conn, $user_id, $title, $message, $type = 'info') {
    try {
        // Check if identical notification already exists to avoid spam (same message in last 24h)
        $q_check = "SELECT COUNT(*) FROM notifications WHERE user_id = :u AND message = :m AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)";
        $st_check = $conn->prepare($q_check);
        $st_check->execute([':u' => $user_id, ':m' => $message]);
        if ($st_check->fetchColumn() > 0) return true;

        $query = "INSERT INTO notifications (user_id, title, message, type) VALUES (:user_id, :title, :message, :type)";
        $stmt = $conn->prepare($query);
        return $stmt->execute([
            ':user_id' => $user_id,
            ':title' => $title,
            ':message' => $message,
            ':type' => $type
        ]);
    } catch (Exception $e) {
        return false;
    }
}

// Function to check deadlines and notify TU
function checkDeadlines($conn) {
    try {
        $tu_users = $conn->query("SELECT id FROM users WHERE role = 'tata_usaha'")->fetchAll(PDO::FETCH_COLUMN);
        if (empty($tu_users)) return;

        $query = "SELECT id, subject, deadline_date FROM letter_requests 
                  WHERE status NOT IN ('Selesai', 'Ditolak') 
                  AND deadline_date IS NOT NULL 
                  AND deadline_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                  AND deadline_date >= CURDATE()";
        $stmt = $conn->query($query);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($requests as $req) {
            $msg = "Permohonan '{$req['subject']}' mendekati deadline ({$req['deadline_date']})";
            foreach ($tu_users as $tu_id) {
                createNotification($conn, $tu_id, "Mendekati Deadline", $msg, "warning");
            }
        }
    } catch (Exception $e) {}
}

// Only handle requests if this file is accessed directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_FILENAME'])) {
    if ($method == 'GET') {
        $user_id = $_GET['user_id'] ?? null;
        $role = $_GET['role'] ?? null; // Optionally pass role to trigger deadline check
        $limit = $_GET['limit'] ?? 10;

        if ($role === 'tata_usaha') {
            checkDeadlines($conn);
        }

        if ($user_id) {
            // Fetch notifications for user
            $query = "SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->execute();
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Count unread
            $query_unread = "SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0";
            $stmt_unread = $conn->prepare($query_unread);
            $stmt_unread->execute([':user_id' => $user_id]);
            $unread_count = $stmt_unread->fetchColumn();

            echo json_encode([
                "success" => true,
                "notifications" => $notifications,
                "unread_count" => (int)$unread_count
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "User ID required"]);
        }

    } elseif ($method == 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        
        if (isset($data->action) && $data->action == 'mark_read') {
            $user_id = $data->user_id ?? null;
            $notif_id = $data->notif_id ?? null; // If null, mark all as read

            if ($user_id) {
                if ($notif_id) {
                    $query = "UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :user_id";
                    $stmt = $conn->prepare($query);
                    $stmt->execute([':id' => $notif_id, ':user_id' => $user_id]);
                } else {
                    $query = "UPDATE notifications SET is_read = 1 WHERE user_id = :user_id";
                    $stmt = $conn->prepare($query);
                    $stmt->execute([':user_id' => $user_id]);
                }
                echo json_encode(["success" => true, "message" => "Notifications marked as read"]);
            } else {
                echo json_encode(["success" => false, "message" => "User ID required"]);
            }
        }
    }
}
?>
