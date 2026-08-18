<?php
include_once 'config.php';
include_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    // Get all users
    $query = "SELECT id, username, full_name, email, jabatan, role, status FROM users ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);

} elseif ($method == 'POST') {
    // Add new user
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->full_name) && !empty($data->email) && !empty($data->password)) {
        // Use email as username
        $username = $data->email;
        
        $query = "INSERT INTO users (username, password, full_name, email, jabatan, role, status) 
                  VALUES (:username, :password, :full_name, :email, :jabatan, :role, :status)";
        
        $stmt = $conn->prepare($query);
        
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $data->password); // In production, use password_hash
        $stmt->bindParam(':full_name', $data->full_name);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':jabatan', $data->jabatan);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':status', $data->status);
        
        if ($stmt->execute()) {
            if (isset($data->admin_id)) {
                recordActivity($conn, $data->admin_id, "Tambah User", "Menambahkan user baru: {$data->full_name}");
            }
            echo json_encode(["success" => true, "message" => "User berhasil ditambahkan"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal menambahkan user"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    }
} elseif ($method == 'PUT') {
    // Update existing user
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->id) && !empty($data->full_name) && !empty($data->email)) {
        $username = $data->email;
        $password_clause = !empty($data->password) ? ", password = :password" : "";
        
        $query = "UPDATE users SET 
                  username = :username, 
                  full_name = :full_name, 
                  email = :email, 
                  jabatan = :jabatan, 
                  role = :role, 
                  status = :status 
                  $password_clause 
                  WHERE id = :id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':full_name', $data->full_name);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':jabatan', $data->jabatan);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':status', $data->status);
        $stmt->bindParam(':id', $data->id);
        if (!empty($data->password)) {
            $stmt->bindParam(':password', $data->password);
        }
        
        if ($stmt->execute()) {
            if (isset($data->admin_id)) {
                recordActivity($conn, $data->admin_id, "Update User", "Memperbarui data user: {$data->full_name}");
            }
            echo json_encode(["success" => true, "message" => "User berhasil diperbarui"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal memperbarui user"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->bindParam(':id', $id);
        if ($stmt->execute()) {
            if (isset($_GET['admin_id'])) {
                recordActivity($conn, $_GET['admin_id'], "Hapus User", "Menghapus user ID: {$id}");
            }
            echo json_encode(["success" => true, "message" => "User berhasil dihapus"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal menghapus user"]);
        }
    }
}
?>
