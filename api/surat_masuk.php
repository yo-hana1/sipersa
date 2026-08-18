<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    $showDeleted = isset($_GET['deleted']) ? 1 : 0;
    $query = "SELECT li.*, ks.nama_kategori 
              FROM letters_incoming li 
              LEFT JOIN kategori_surat ks ON li.id_kategori = ks.id_kategori 
              WHERE li.is_deleted = $showDeleted
              ORDER BY li.date_received DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check if this is a restore/delete action (from JSON)
    if (isset($data['id']) && isset($data['is_deleted'])) {
        $query = "UPDATE letters_incoming SET is_deleted = :is_del, deleted_at = :del_at WHERE id = :id";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([
            ':is_del' => $data['is_deleted'],
            ':del_at' => $data['is_deleted'] ? date('Y-m-d H:i:s') : null,
            ':id' => $data['id']
        ]);
        echo json_encode(["success" => $result, "message" => $result ? "Status surat diperbarui" : "Gagal memperbarui status"]);
        exit;
    }

    // Handle File Upload if exists (from multipart/form-data)
    $file_path = null;
    if (isset($_FILES['file']) && $_FILES['file']['error'] == 0) {
        $target_dir = "uploads/masuk/";
        if (!is_dir($target_dir)) mkdir($target_dir, 0777, true);
        $file_path = $target_dir . time() . "_" . basename($_FILES["file"]["name"]);
        move_uploaded_file($_FILES["file"]["tmp_name"], $file_path);
    }

    $data = $_POST;
    if (empty($data['letter_number']) && empty($data['sender'])) {
        $json = json_decode(file_get_contents("php://input"), true);
        if ($json) $data = $json;
    }

    try {
        $query = "INSERT INTO letters_incoming (letter_number, sender, recipient, subject, date_received, id_kategori, file_path) 
                  VALUES (:num, :sender, :recipient, :subject, :date, :id_kat, :file)";
        $stmt = $conn->prepare($query);
        if ($stmt->execute([
            ':num' => $data['letter_number'],
            ':sender' => $data['sender'],
            ':recipient' => $data['recipient'] ?? 'PAUD Terpadu Restu 2',
            ':subject' => $data['subject'],
            ':date' => $data['date_received'] ?? date('Y-m-d'),
            ':id_kat' => $data['id_kategori'] ?? null,
            ':file' => $file_path
        ])) {
            echo json_encode(["success" => true, "message" => "Surat masuk berhasil dicatat"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal menyimpan data"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $query = "UPDATE letters_incoming SET is_deleted = 1, deleted_at = NOW() WHERE id = :id";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([':id' => $id]);
        echo json_encode(["success" => $result, "message" => $result ? "Surat berhasil dibatalkan" : "Gagal membatalkan surat"]);
    }
}
?>
