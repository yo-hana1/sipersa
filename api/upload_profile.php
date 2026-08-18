<?php
include_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'POST') {
    $user_id = $_POST['user_id'] ?? null;
    
    if (!$user_id) {
        echo json_encode(["success" => false, "message" => "User ID tidak ditemukan"]);
        exit;
    }

    if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/profiles/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        // Clean filename to prevent issues
        $original_name = preg_replace('/[^a-zA-Z0-9.\-_]/', '_', basename($_FILES['profile_picture']['name']));
        $file_name = "user_" . $user_id . "_" . time() . '_' . $original_name;
        $target_file = $upload_dir . $file_name;

        $allowed_types = ['jpg', 'jpeg', 'png'];
        $file_ext = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        if (in_array($file_ext, $allowed_types)) {
            if (move_uploaded_file($_FILES['profile_picture']['tmp_name'], $target_file)) {
                
                // Update database
                $query = "UPDATE users SET profile_picture = :profile_picture WHERE id = :id";
                $stmt = $conn->prepare($query);
                
                if ($stmt->execute([':profile_picture' => $target_file, ':id' => $user_id])) {
                    echo json_encode([
                        "success" => true, 
                        "message" => "Foto profil berhasil diperbarui",
                        "profile_picture" => $target_file
                    ]);
                } else {
                    echo json_encode(["success" => false, "message" => "Gagal update database"]);
                }

            } else {
                echo json_encode(["success" => false, "message" => "Gagal upload file"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Format file tidak didukung (hanya JPG/PNG)"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Tidak ada file yang diupload atau terjadi error"]);
    }
}
?>
