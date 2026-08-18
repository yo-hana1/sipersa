<?php
include_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->user_id) && !empty($data->new_password) && !empty($data->confirm_password)) {
    if ($data->new_password !== $data->confirm_password) {
        echo json_encode(["success" => false, "message" => "Password dan konfirmasi password tidak cocok."]);
        exit;
    }

    $user_id = $data->user_id;
    $password = $data->new_password;

    try {
        $query = "UPDATE users SET password = :password WHERE id = :id";
        $stmt = $conn->prepare($query);
        
        if ($stmt->execute([':password' => $password, ':id' => $user_id])) {
            echo json_encode(["success" => true, "message" => "Password berhasil diperbarui."]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal memperbarui password."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Data tidak lengkap."]);
}
?>
