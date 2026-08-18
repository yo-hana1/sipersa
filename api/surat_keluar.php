<?php
include_once 'config.php';
include_once 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    // Get all outgoing letters
    $is_deleted = isset($_GET['deleted']) && $_GET['deleted'] == '1' ? 1 : 0;
    $order_by = $is_deleted == 1 ? "ORDER BY lo.deleted_at ASC" : "ORDER BY lo.created_at DESC";
    
    $query = "SELECT lo.*, lt.name as template_name, u.full_name as requester_name, ks.nama_kategori, lr.deadline_date, lr.content as permohonan_content, lr.subject as permohonan_subject
              FROM letters_outgoing lo
              LEFT JOIN letter_templates lt ON lo.template_id = lt.id
              LEFT JOIN letter_requests lr ON lo.request_id = lr.id
              LEFT JOIN users u ON lr.user_id = u.id
              LEFT JOIN kategori_surat ks ON lo.id_kategori = ks.id_kategori
              WHERE lo.is_deleted = :is_deleted
              $order_by";
    
    if (isset($_GET['id'])) {
        $query = "SELECT lo.*, lt.name as template_name FROM letters_outgoing lo 
                  LEFT JOIN letter_templates lt ON lo.template_id = lt.id 
                  WHERE lo.id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([':id' => $_GET['id']]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($result);
    } else {
        $stmt = $conn->prepare($query);
        $stmt->execute([':is_deleted' => $is_deleted]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    }

} elseif ($method == 'POST') {
    try {
        $rawInput = file_get_contents("php://input");
        $data = json_decode($rawInput);

        if (isset($data->id)) {
            // UPDATE existing (Auto-save or Finalize)
            $fields = [];
            $params = [':id' => $data->id];

            if (isset($data->status)) {
                $fields[] = "status = :status";
                $params[':status'] = $data->status;
            }
            if (isset($data->draft_data)) {
                $fields[] = "draft_data = :draft_data";
                $params[':draft_data'] = is_string($data->draft_data) ? $data->draft_data : json_encode($data->draft_data);
            }
            if (isset($data->letter_number)) {
                $fields[] = "letter_number = :letter_number";
                $params[':letter_number'] = $data->letter_number;
            }
            if (isset($data->recipient)) {
                $fields[] = "recipient = :recipient";
                $params[':recipient'] = $data->recipient;
            }
            if (isset($data->subject)) {
                $fields[] = "subject = :subject";
                $params[':subject'] = $data->subject;
            }
            if (isset($data->date_sent)) {
                $fields[] = "date_sent = :date_sent";
                $params[':date_sent'] = $data->date_sent;
            }
            // Auto-set date_sent ketika status berubah menjadi 'Disetujui'
            if (isset($data->status) && $data->status === 'Disetujui' && !isset($data->date_sent)) {
                $fields[] = "date_sent = CURDATE()";
            }
            if (isset($data->id_kategori)) {
                $fields[] = "id_kategori = :id_kategori";
                $params[':id_kategori'] = $data->id_kategori;
            }
            if (isset($data->is_deleted)) {
                $fields[] = "is_deleted = :is_deleted";
                $params[':is_deleted'] = $data->is_deleted;
                if ($data->is_deleted == 1) {
                    $fields[] = "deleted_at = CURRENT_TIMESTAMP";
                } else {
                    $fields[] = "deleted_at = NULL";
                }
            }

            if (isset($data->rejection_reason)) {
                $fields[] = "rejection_reason = :rejection_reason";
                $params[':rejection_reason'] = $data->rejection_reason;
            }

            if (empty($fields)) {
                echo json_encode(["success" => false, "message" => "No fields to update"]);
                exit;
            }

            $query = "UPDATE letters_outgoing SET " . implode(", ", $fields) . " WHERE id = :id";
            $stmt = $conn->prepare($query);
            
            if (isset($data->is_deleted) && $data->is_deleted == 1) {
                // NOTIFICATION: Notify Admin
                try {
                    include_once 'notifications.php';
                    // Fetch subject if not in data
                    $subject = $data->subject ?? '';
                    if (!$subject) {
                        $st_sub = $conn->prepare("SELECT subject FROM letters_outgoing WHERE id = :id");
                        $st_sub->execute([':id' => $data->id]);
                        $subject = $st_sub->fetchColumn();
                    }
                    
                    $admin_users = $conn->query("SELECT id FROM users WHERE role = 'admin'")->fetchAll(PDO::FETCH_COLUMN);
                    foreach ($admin_users as $admin_id) {
                        createNotification($conn, $admin_id, "Data Dihapus", "Surat keluar '{$subject}' telah dihapus dan masuk ke Backup & Restore", "danger");
                    }
                } catch (Exception $e) {}
            }

            if ($stmt->execute($params)) {
                // Record activity
                $subject = $data->subject ?? '';
                if (!$subject) {
                    $st_sub = $conn->prepare("SELECT subject FROM letters_outgoing WHERE id = :id");
                    $st_sub->execute([':id' => $data->id]);
                    $subject = $st_sub->fetchColumn() ?: 'Surat Tanpa Perihal';
                }
                
                if (isset($data->user_id)) {
                    $action = "Update Surat";
                    if (isset($data->status)) $action = "Update Status: {$data->status}";
                    recordActivity($conn, $data->user_id, $action, "Surat: {$subject}");
                }
                // NOTIFICATIONS
                try {
                    include_once 'notifications.php';
                    if (isset($data->status)) {
                        $current_subject = $data->subject ?? '';
                        if (!$current_subject) {
                            $st_sub = $conn->prepare("SELECT subject FROM letters_outgoing WHERE id = :id");
                            $st_sub->execute([':id' => $data->id]);
                            $current_subject = $st_sub->fetchColumn() ?: 'Surat Tanpa Perihal';
                        }

                        if ($data->status == 'Menunggu Persetujuan') {
                            // Notify Kepsek
                            $kepsek_users = $conn->query("SELECT id FROM users WHERE role = 'kepala_sekolah'")->fetchAll(PDO::FETCH_COLUMN);
                            foreach ($kepsek_users as $ks_id) {
                                createNotification($conn, $ks_id, "Draft Surat Baru", "Ada draft surat '{$current_subject}' yang menunggu persetujuan Anda", "warning");
                            }
                        } elseif ($data->status == 'Disetujui' || $data->status == 'Ditolak') {
                            // Notify TU
                            $tu_users = $conn->query("SELECT id FROM users WHERE role = 'tata_usaha'")->fetchAll(PDO::FETCH_COLUMN);
                            foreach ($tu_users as $tu_id) {
                                createNotification($conn, $tu_id, "Status Approval", "Draft surat '{$current_subject}' telah {$data->status} oleh Kepsek", $data->status == 'Disetujui' ? 'success' : 'warning');
                            }
                            
                            // Notify Guru (Requester)
                            $q_req = "SELECT lr.user_id, lr.subject FROM letters_outgoing lo JOIN letter_requests lr ON lo.request_id = lr.id WHERE lo.id = :id";
                            $st_req = $conn->prepare($q_req);
                            $st_req->execute([':id' => $data->id]);
                            $req_data = $st_req->fetch(PDO::FETCH_ASSOC);
                            if ($req_data) {
                                createNotification($conn, $req_data['user_id'], "Permohonan Disetujui", "Permohonan Anda '{$req_data['subject']}' telah {$data->status} oleh Kepala Sekolah", $data->status == 'Disetujui' ? 'success' : 'warning');
                            }
                        }
                    }
                } catch (Exception $e) {}

                echo json_encode(["success" => true, "message" => "Draft updated successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Update failed"]);
            }

        } else {
            // CREATE new draft
            $query = "INSERT INTO letters_outgoing (letter_number, sender, recipient, subject, status, template_id, request_id, draft_data, date_sent, id_kategori) 
                      VALUES (:letter_number, :sender, :recipient, :subject, :status, :template_id, :request_id, :draft_data, :date_sent, :id_kategori)";
            
            $stmt = $conn->prepare($query);
            
            $params = [
                ':letter_number' => $data->letter_number ?? null,
                ':sender' => $data->sender ?? 'PAUD Terpadu Restu 2',
                ':recipient' => $data->recipient ?? '',
                ':subject' => $data->subject ?? '',
                ':status' => $data->status ?? 'Draft',
                ':template_id' => $data->template_id ?? null,
                ':request_id' => $data->request_id ?? null,
                ':draft_data' => isset($data->draft_data) ? (is_string($data->draft_data) ? $data->draft_data : json_encode($data->draft_data)) : null,
                ':date_sent' => $data->date_sent ?? null,
                ':id_kategori' => $data->id_kategori ?? null
            ];

            if ($stmt->execute($params)) {
                // Record activity
                if (isset($data->user_id)) {
                    recordActivity($conn, $data->user_id, "Buat Draft", "Membuat draft surat baru untuk: {$data->recipient}");
                }
                echo json_encode(["success" => true, "id" => $conn->lastInsertId(), "message" => "Draft created successfully"]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed to create draft"]);
            }
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} elseif ($method == 'DELETE') {
    // Permanent Delete (Hard Delete) to reset sequence numbering
    $id = $_GET['id'] ?? null;
    $request_id = $_GET['request_id'] ?? null;

    if ($id) {
        $query = "DELETE FROM letters_outgoing WHERE id = :id";
        $stmt = $conn->prepare($query);
        $success = $stmt->execute([':id' => $id]);
    } elseif ($request_id) {
        $query = "DELETE FROM letters_outgoing WHERE request_id = :request_id";
        $stmt = $conn->prepare($query);
        $success = $stmt->execute([':request_id' => $request_id]);
    } else {
        echo json_encode(["success" => false, "message" => "ID or Request ID required"]);
        exit;
    }

    if ($success) {
        echo json_encode(["success" => true, "message" => "Draft deleted permanently"]);
    } else {
        echo json_encode(["success" => false, "message" => "Delete failed"]);
    }
}
?>
