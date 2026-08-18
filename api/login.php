<?php
include_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->username) && !empty($data->password)) {
    $username = $data->username;
    $password = $data->password;

    try {
        $query = "SELECT id, username, full_name, email, role, profile_picture FROM users WHERE username = :username AND password = :password LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $password);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                "success" => true,
                "user" => $user
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Email atau password salah."
            ]);
        }
    } catch (PDOException $e) {
        // Fallback if profile_picture column doesn't exist
        if (strpos($e->getMessage(), 'Unknown column') !== false) {
            try {
                $conn->exec("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL");
                // Retry the original query
                $stmt = $conn->prepare($query);
                $stmt->bindParam(':username', $username);
                $stmt->bindParam(':password', $password);
                $stmt->execute();
                
                if($stmt->rowCount() > 0) {
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    echo json_encode([
                        "success" => true,
                        "user" => $user
                    ]);
                } else {
                    echo json_encode([
                        "success" => false,
                        "message" => "Email atau password salah."
                    ]);
                }
            } catch (PDOException $ex) {
                // If migration still fails, just use the old query
                $query_old = "SELECT id, username, full_name, email, role FROM users WHERE username = :username AND password = :password LIMIT 1";
                $stmt_old = $conn->prepare($query_old);
                $stmt_old->bindParam(':username', $username);
                $stmt_old->bindParam(':password', $password);
                $stmt_old->execute();

                if($stmt_old->rowCount() > 0) {
                    $user = $stmt_old->fetch(PDO::FETCH_ASSOC);
                    echo json_encode([
                        "success" => true,
                        "user" => $user
                    ]);
                } else {
                    echo json_encode([
                        "success" => false,
                        "message" => "Email atau password salah."
                    ]);
                }
            }
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Database error: " . $e->getMessage()
            ]);
        }
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Data tidak lengkap."
    ]);
}
?>
