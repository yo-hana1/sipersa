<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    $show_deleted = isset($_GET['deleted']) && $_GET['deleted'] == '1';
    $is_deleted = $show_deleted ? 1 : 0;
    
    $query = "SELECT lt.*, ks.nama_kategori 
              FROM letter_templates lt 
              LEFT JOIN kategori_surat ks ON lt.id_kategori = ks.id_kategori 
              WHERE lt.is_deleted = :is_deleted
              ORDER BY lt.name ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute([':is_deleted' => $is_deleted]);
    $templates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($templates);

} elseif ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Handle Restore Action
    if (isset($data->action) && $data->action === 'restore' && !empty($data->id)) {
        try {
            $query = "UPDATE letter_templates SET is_deleted = 0, deleted_at = NULL WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute([':id' => $data->id]);
            echo json_encode(["success" => true, "message" => "Template berhasil dipulihkan"]);
            exit;
        } catch (PDOException $e) {
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
            exit;
        }
    }

    if (empty($data->name) || empty($data->id_kategori) || empty($data->number_format)) {
        echo json_encode(["success" => false, "message" => "Data wajib diisi (Nama, Kategori, dan Format Penomoran) tidak boleh kosong"]);
        exit;
    }

    try {
        $id_kategori = (isset($data->id_kategori) && $data->id_kategori !== "") ? $data->id_kategori : null;
        $query = "INSERT INTO letter_templates (name, type, content, id_kategori, number_format, description) 
                  VALUES (:name, :type, :content, :id_kat, :num_fmt, :description)";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':name' => $data->name,
            ':type' => $data->type ?? 'umum',
            ':content' => $data->content ?? '',
            ':id_kat' => $id_kategori,
            ':num_fmt' => $data->number_format ?? '[SEQ]/PAUD-R2/[MONTH]/[YEAR]',
            ':description' => $data->description ?? ''
        ]);
        echo json_encode(["success" => true, "message" => "Template berhasil ditambahkan"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }

} elseif ($method == 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->id) || empty($data->name) || empty($data->id_kategori) || empty($data->number_format)) {
        echo json_encode(["success" => false, "message" => "Data tidak lengkap atau data wajib diisi masih kosong"]);
        exit;
    }

    try {
        $id_kategori = (isset($data->id_kategori) && $data->id_kategori !== "") ? $data->id_kategori : null;
        $query = "UPDATE letter_templates SET name = :name, type = :type, content = :content, id_kategori = :id_kat, number_format = :num_fmt, description = :description WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':name' => $data->name,
            ':type' => $data->type ?? 'umum',
            ':content' => $data->content ?? '',
            ':id_kat' => $id_kategori,
            ':num_fmt' => $data->number_format ?? '[SEQ]/PAUD-R2/[MONTH]/[YEAR]',
            ':description' => $data->description ?? '',
            ':id' => $data->id
        ]);
        echo json_encode(["success" => true, "message" => "Template berhasil diperbarui"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} elseif ($method == 'DELETE') {
    if (empty($_GET['id'])) {
        echo json_encode(["success" => false, "message" => "ID tidak ditemukan"]);
        exit;
    }

    try {
        $query = "UPDATE letter_templates SET is_deleted = 1, deleted_at = NOW() WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $_GET['id']]);
        echo json_encode(["success" => true, "message" => "Template berhasil dipindahkan ke tempat sampah"]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
}
?>
