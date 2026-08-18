<?php
include_once 'config.php';
include_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    // Get all permohonan surat
    $showDeleted = isset($_GET['deleted']) ? 1 : 0;
    $query = "SELECT lr.*, u.full_name as pemohon, lo.letter_number as final_number, lo.draft_data as final_draft_data, lt.name as template_name, lo.id as outgoing_id
              FROM letter_requests lr 
              JOIN users u ON lr.user_id = u.id 
              LEFT JOIN letters_outgoing lo ON lr.id = lo.request_id AND lo.status IN ('Selesai', 'Disetujui')
              LEFT JOIN letter_templates lt ON lo.template_id = lt.id
              WHERE lr.is_deleted = $showDeleted
              ORDER BY lr.created_at ASC";
    $stmt = $conn->prepare($query);
    $stmt->execute();

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map status to badge color
    foreach ($results as &$row) {
        switch ($row['status']) {
            case 'Disetujui':
                $row['badge'] = 'success';
                break;
            case 'Ditolak':
                $row['badge'] = 'danger';
                break;
            case 'Menunggu':
                $row['badge'] = 'info';
                break;
            case 'Diproses':
                $row['badge'] = 'warning';
                break;
            case 'Selesai':
                $row['badge'] = 'success';
                break;
            default:
                $row['badge'] = 'secondary';
        }
        // Base URL for files
        if ($row['file_path']) {
            $row['file_url'] = "http://localhost/siarsad/api/" . $row['file_path'];
        }
    }

    echo json_encode($results);

} elseif ($method == 'POST') {
    // Check if this is an update request (has id and status in body or json)
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (isset($data->id) && isset($data->is_deleted)) {
        // Handle Restore/Soft Delete from JSON
        $query = "UPDATE letter_requests SET is_deleted = :is_del, deleted_at = :del_at WHERE id = :id";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([
            ':is_del' => $data->is_deleted,
            ':del_at' => $data->is_deleted ? date('Y-m-d H:i:s') : null,
            ':id' => $data->id
        ]);
        if ($result) {
            if (isset($data->user_id)) {
                $action = $data->is_deleted ? "Hapus Permohonan" : "Restore Permohonan";
                recordActivity($conn, $data->user_id, $action, "ID: {$data->id}");
            }
        }
        echo json_encode(["success" => $result, "message" => $result ? "Status permohonan diperbarui" : "Gagal memperbarui status"]);
        exit;
    }

    if (isset($data->id) && isset($data->status)) {
        // This is an UPDATE request via POST (Status change)
        $rejection_reason = $data->rejection_reason ?? null;
        
        $query = "UPDATE letter_requests SET status = :status, rejection_reason = :rejection_reason WHERE id = :id";
        $stmt = $conn->prepare($query);
        if ($stmt->execute([
            ':status' => $data->status, 
            ':rejection_reason' => $rejection_reason,
            ':id' => $data->id
        ])) {
            if (isset($data->user_id)) {
                recordActivity($conn, $data->user_id, "Update Status", "ID: {$data->id} -> {$data->status}");
            }
            echo json_encode(["success" => true, "message" => "Status berhasil diperbarui"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal memperbarui status"]);
        }
        exit;
    }

    // Handle Add new permohonan (with file upload)
    $user_id = $_POST['user_id'] ?? null;
    $letter_type = $_POST['letter_type'] ?? null;
    $subject = $_POST['subject'] ?? null;
    $content = $_POST['content'] ?? null;
    $id_kategori = $_POST['id_kategori'] ?? null;
    $deadline_date = $_POST['deadline_date'] ?? null;
    $file_path = null;

    if (!$user_id || !$letter_type || !$subject) {
        echo json_encode(["success" => false, "message" => "Data tidak lengkap"]);
        exit;
    }

    // Handle File Upload & AI Document Reading
    $extracted_text = null;
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $file_name = time() . '_' . basename($_FILES['attachment']['name']);
        $target_file = $upload_dir . $file_name;

        $allowed_types = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        $file_ext = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        if (in_array($file_ext, $allowed_types)) {
            if (move_uploaded_file($_FILES['attachment']['tmp_name'], $target_file)) {
                $file_path = $target_file;

                // Call Gemini AI to index document text for searching
                try {
                    $fileData = base64_encode(file_get_contents($target_file));
                    $fileType = $_FILES['attachment']['type'];
                    $apiKey = GEMINI_API_KEY;
                    $model = "gemini-2.0-flash"; 
                    $url = "https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}";

                    $payload = [
                        "contents" => [
                            [
                                "parts" => [
                                    ["text" => "Read and extract all important text from this document for indexing and search purposes. Return the text concisely."],
                                    [
                                        "inline_data" => [
                                            "mime_type" => $fileType,
                                            "data" => $fileData
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ];

                    $ch = curl_init($url);
                    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch, CURLOPT_POST, true);
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
                    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                    $aiResponse = curl_exec($ch);
                    curl_close($ch);

                    $aiResult = json_decode($aiResponse);
                    if (isset($aiResult->candidates[0]->content->parts[0]->text)) {
                        $extracted_text = $aiResult->candidates[0]->content->parts[0]->text;
                    }
                } catch (Exception $e) {
                    // Fail silently for AI indexing, don't block the request
                }
            } else {
                echo json_encode(["success" => false, "message" => "Gagal upload file"]);
                exit;
            }
        } else {
            echo json_encode(["success" => false, "message" => "Format file tidak didukung"]);
            exit;
        }
    }

    $query = "INSERT INTO letter_requests (user_id, letter_type, subject, content, date_requested, status, file_path, id_kategori, deadline_date, extracted_text) 
              VALUES (:user_id, :type, :subject, :content, :date, 'Menunggu', :file_path, :id_kategori, :deadline_date, :extracted_text)";

    $stmt = $conn->prepare($query);
    $date = date('Y-m-d');

    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':type', $letter_type);
    $stmt->bindParam(':subject', $subject);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':date', $date);
    $stmt->bindParam(':file_path', $file_path);
    $stmt->bindParam(':id_kategori', $id_kategori);
    $stmt->bindParam(':deadline_date', $deadline_date);
    $stmt->bindParam(':extracted_text', $extracted_text);

    if ($stmt->execute()) {
        if ($user_id) {
            recordActivity($conn, $user_id, "Buat Permohonan", "Subjek: {$subject}");
        }
        // NOTIFICATION: Notify TU about new request
        try {
            include_once 'notifications.php';
            $msg = "Ada permohonan surat baru: '{$subject}'";
            $tu_users = $conn->query("SELECT id FROM users WHERE role = 'tata_usaha'")->fetchAll(PDO::FETCH_COLUMN);
            foreach ($tu_users as $tu_id) {
                createNotification($conn, $tu_id, "Permohonan Baru", $msg, "info");
            }
        } catch (Exception $e) {}
        
        echo json_encode(["success" => true, "message" => "Permohonan berhasil dikirim"]);
    } else {
        echo json_encode(["success" => false, "message" => "Gagal menyimpan ke database"]);
    }
} elseif ($method == 'PUT') {
    // Update status permohonan
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput);

    if (isset($data->id) && !empty($data->status)) {
        $rejection_reason = $data->rejection_reason ?? null;
        $query = "UPDATE letter_requests SET status = :status, rejection_reason = :rejection_reason WHERE id = :id";
        $stmt = $conn->prepare($query);

        if ($stmt->execute([
            ':status' => $data->status, 
            ':rejection_reason' => $rejection_reason,
            ':id' => $data->id
        ])) {
            // NOTIFICATION: Notify Guru about status change
            try {
                include_once 'notifications.php';
                // Get the user_id of the requester
                $q_req = "SELECT user_id, subject FROM letter_requests WHERE id = :id";
                $st_req = $conn->prepare($q_req);
                $st_req->execute([':id' => $data->id]);
                $req_data = $st_req->fetch(PDO::FETCH_ASSOC);
                
                if ($req_data) {
                    $msg = "Status permohonan '{$req_data['subject']}' telah diperbarui menjadi '{$data->status}'";
                    createNotification($conn, $req_data['user_id'], "Update Permohonan", $msg, $data->status == 'Ditolak' ? 'warning' : 'success');
                }
            } catch (Exception $e) {}

            echo json_encode(["success" => true, "message" => "Status berhasil diperbarui"]);
        } else {
            echo json_encode(["success" => false, "message" => "Gagal memperbarui status"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Data tidak lengkap: id=" . ($data->id ?? 'null') . ", status=" . ($data->status ?? 'null')]);
    }
} elseif ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $query = "UPDATE letter_requests SET is_deleted = 1, deleted_at = NOW() WHERE id = :id";
        $stmt = $conn->prepare($query);
        $result = $stmt->execute([':id' => $id]);
        echo json_encode(["success" => $result, "message" => $result ? "Permohonan berhasil dibatalkan" : "Gagal membatalkan permohonan"]);
    }
}
?>