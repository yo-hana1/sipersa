<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $type = $_GET['type'] ?? 'semua';
    $id_kategori = $_GET['id_kategori'] ?? '';
    $start_date = $_GET['start_date'] ?? '';
    $end_date = $_GET['end_date'] ?? '';

    $results = [];

    // Base queries
    $query_masuk = "SELECT sm.id, 'Surat Masuk' as jenis, sm.letter_number, sm.subject, sm.sender as pihak, sm.date_received as tanggal, ks.nama_kategori 
                    FROM letters_incoming sm 
                    LEFT JOIN kategori_surat ks ON sm.id_kategori = ks.id_kategori 
                    WHERE sm.is_deleted = 0";

    $query_keluar = "SELECT lo.id, 'Surat Keluar' as jenis, lo.letter_number, lo.subject, lo.recipient as pihak, lo.date_sent as tanggal, ks.nama_kategori 
                     FROM letters_outgoing lo 
                     LEFT JOIN kategori_surat ks ON lo.id_kategori = ks.id_kategori 
                     WHERE lo.is_deleted = 0 AND lo.status = 'disetujui'";

    // Apply filters
    $conditions = [];
    $params = [];

    if (!empty($id_kategori)) {
        $conditions[] = "ks.id_kategori = :id_kategori";
        $params[':id_kategori'] = $id_kategori;
    }

    if (!empty($start_date)) {
        $conditions[] = "tanggal >= :start_date";
        $params[':start_date'] = $start_date;
    }

    if (!empty($end_date)) {
        $conditions[] = "tanggal <= :end_date";
        $params[':end_date'] = $end_date;
    }

    $where_clause = "";
    if (!empty($conditions)) {
        $where_clause = " AND " . implode(" AND ", $conditions);
    }

    try {
        if ($type == 'masuk' || $type == 'semua') {
            $stmt = $conn->prepare($query_masuk . str_replace('tanggal', 'sm.date_received', $where_clause));
            $stmt->execute($params);
            $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));
        }

        if ($type == 'keluar' || $type == 'semua') {
            $stmt = $conn->prepare($query_keluar . str_replace('tanggal', 'lo.date_sent', $where_clause));
            $stmt->execute($params);
            $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));
        }

        // Sort by date descending
        usort($results, function($a, $b) {
            return strtotime($b['tanggal']) - strtotime($a['tanggal']);
        });

        echo json_encode($results);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
}
?>
