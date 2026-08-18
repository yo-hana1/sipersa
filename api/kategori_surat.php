<?php
include_once 'config.php';
include_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    try {
        $is_deleted = isset($_GET['deleted']) && $_GET['deleted'] == '1' ? 1 : 0;
        $order_by = $is_deleted == 1 ? "ORDER BY deleted_at DESC" : "ORDER BY id_kategori ASC";
        
        $query = "SELECT * FROM kategori_surat WHERE is_deleted = :is_deleted $order_by";
        $stmt = $conn->prepare($query);
        $stmt->execute([':is_deleted' => $is_deleted]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Check for Restore Action
    if (isset($data->id_kategori) && isset($data->is_deleted)) {
        try {
            $query = "UPDATE kategori_surat SET is_deleted = :is_deleted, deleted_at = :del_at WHERE id_kategori = :id";
            $stmt = $conn->prepare($query);
            if ($stmt->execute([
                ':is_deleted' => $data->is_deleted,
                ':del_at' => $data->is_deleted == 1 ? date('Y-m-d H:i:s') : null,
                ':id' => $data->id_kategori
            ])) {
                if (isset($data->user_id)) {
                    $action = $data->is_deleted == 1 ? "Hapus Kategori" : "Restore Kategori";
                    recordActivity($conn, $data->user_id, $action, "ID: {$data->id_kategori}");
                }
                echo json_encode(["success" => true, "message" => $data->is_deleted == 1 ? "Kategori berhasil dihapus" : "Kategori berhasil dipulihkan"]);
            } else {
                echo json_encode(["success" => false, "message" => "Gagal memproses kategori"]);
            }
            exit;
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
            exit;
        }
    }

    if (empty($data->nama_kategori)) {
        echo json_encode(["success" => false, "message" => "Nama kategori wajib diisi"]);
        exit;
    }

    try {
        // Check for duplicate (including those that are soft-deleted, or should we allow re-using names?)
        // In many systems, if a name is soft-deleted, you can't reuse it unless you restore it.
        // I'll check against all records to avoid unique constraint violations.
        $checkQuery = "SELECT COUNT(*) FROM kategori_surat WHERE nama_kategori = :nama";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->execute([':nama' => $data->nama_kategori]);
        if ($checkStmt->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Nama kategori sudah ada (mungkin ada di Backup & Restore)"]);
            exit;
        }

        $query = "INSERT INTO kategori_surat (nama_kategori, deskripsi) VALUES (:nama, :desc)";
        $stmt = $conn->prepare($query);
        if ($stmt->execute([
            ':nama' => $data->nama_kategori,
            ':desc' => $data->deskripsi ?? ''
        ])) {
            if (isset($data->user_id)) {
                recordActivity($conn, $data->user_id, "Tambah Kategori", "Kategori: {$data->nama_kategori}");
            }
            echo json_encode(["success" => true, "message" => "Kategori berhasil ditambahkan"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal menambahkan kategori"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id_kategori) || empty($data->nama_kategori)) {
        echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
        exit;
    }

    try {
        // Check for duplicate excluding itself
        $checkQuery = "SELECT COUNT(*) FROM kategori_surat WHERE nama_kategori = :nama AND id_kategori != :id";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->execute([':nama' => $data->nama_kategori, ':id' => $data->id_kategori]);
        if ($checkStmt->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Nama kategori sudah ada"]);
            exit;
        }

        $query = "UPDATE kategori_surat SET nama_kategori = :nama, deskripsi = :desc WHERE id_kategori = :id";
        $stmt = $conn->prepare($query);
        if ($stmt->execute([
            ':nama' => $data->nama_kategori,
            ':desc' => $data->deskripsi ?? '',
            ':id' => $data->id_kategori
        ])) {
            if (isset($data->user_id)) {
                recordActivity($conn, $data->user_id, "Update Kategori", "Kategori: {$data->nama_kategori}");
            }
            echo json_encode(["success" => true, "message" => "Kategori berhasil diperbarui"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal memperbarui kategori"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $data = json_decode(file_get_contents("php://input"));
        $id = $data->id_kategori ?? null;
    }

    if (!$id) {
        echo json_encode(["success" => false, "message" => "ID tidak ditemukan"]);
        exit;
    }

    try {
        // Soft delete
        $query = "UPDATE kategori_surat SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id_kategori = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true, "message" => "Kategori berhasil dipindahkan ke Backup & Restore"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
?>
