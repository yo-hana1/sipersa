<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'GET') {
    $type = $_GET['type'] ?? 'structure'; // 'structure' | 'masuk' | 'keluar'

    // ─── MODE: Struktur Folder ────────────────────────────────────────────────
    if ($type === 'structure') {
        $structure = [
            'masuk'  => [],
            'keluar' => []
        ];

        // Struktur folder Surat Masuk (berdasarkan date_received)
        $q_masuk = "
            SELECT 
                YEAR(date_received) AS tahun,
                MONTH(date_received) AS bulan,
                COUNT(*) AS jumlah
            FROM letters_incoming
            WHERE is_deleted = 0 AND date_received IS NOT NULL
            GROUP BY YEAR(date_received), MONTH(date_received)
            ORDER BY tahun DESC, bulan ASC
        ";
        $stmt = $conn->prepare($q_masuk);
        $stmt->execute();
        $rows_masuk = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows_masuk as $row) {
            $tahun = (int)$row['tahun'];
            $bulan = (int)$row['bulan'];
            if (!isset($structure['masuk'][$tahun])) {
                $structure['masuk'][$tahun] = [];
            }
            $structure['masuk'][$tahun][$bulan] = (int)$row['jumlah'];
        }

        // Struktur folder Surat Keluar (status Disetujui atau Selesai)
        $q_keluar = "
            SELECT 
                YEAR(COALESCE(date_sent, created_at)) AS tahun,
                MONTH(COALESCE(date_sent, created_at)) AS bulan,
                COUNT(*) AS jumlah
            FROM letters_outgoing
            WHERE is_deleted = 0 
              AND status IN ('Disetujui', 'Selesai')
            GROUP BY YEAR(COALESCE(date_sent, created_at)), MONTH(COALESCE(date_sent, created_at))
            ORDER BY tahun DESC, bulan ASC
        ";
        $stmt = $conn->prepare($q_keluar);
        $stmt->execute();
        $rows_keluar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows_keluar as $row) {
            $tahun = (int)$row['tahun'];
            $bulan = (int)$row['bulan'];
            if (!isset($structure['keluar'][$tahun])) {
                $structure['keluar'][$tahun] = [];
            }
            $structure['keluar'][$tahun][$bulan] = (int)$row['jumlah'];
        }

        // Konversi ke format array agar mudah dikonsumsi frontend
        $result = ['masuk' => [], 'keluar' => []];

        foreach ($structure['masuk'] as $tahun => $bulan_data) {
            $bulan_list = [];
            foreach ($bulan_data as $bulan => $jumlah) {
                $bulan_list[] = ['bulan' => $bulan, 'jumlah' => $jumlah];
            }
            $result['masuk'][] = ['tahun' => $tahun, 'bulan' => $bulan_list];
        }

        foreach ($structure['keluar'] as $tahun => $bulan_data) {
            $bulan_list = [];
            foreach ($bulan_data as $bulan => $jumlah) {
                $bulan_list[] = ['bulan' => $bulan, 'jumlah' => $jumlah];
            }
            $result['keluar'][] = ['tahun' => $tahun, 'bulan' => $bulan_list];
        }

        // Pastikan tahun 2026 selalu ada (minimal entry kosong)
        $has_2026_masuk = array_filter($result['masuk'], fn($t) => $t['tahun'] === 2026);
        if (empty($has_2026_masuk)) {
            array_unshift($result['masuk'], ['tahun' => 2026, 'bulan' => []]);
        }
        $has_2026_keluar = array_filter($result['keluar'], fn($t) => $t['tahun'] === 2026);
        if (empty($has_2026_keluar)) {
            array_unshift($result['keluar'], ['tahun' => 2026, 'bulan' => []]);
        }

        echo json_encode(['success' => true, 'data' => $result]);

    // ─── MODE: List Surat Masuk per Folder ───────────────────────────────────
    } elseif ($type === 'masuk') {
        $year  = isset($_GET['year'])  ? (int)$_GET['year']  : null;
        $month = isset($_GET['month']) ? (int)$_GET['month'] : null;

        $where = "WHERE li.is_deleted = 0";
        $params = [];

        if ($year) {
            $where .= " AND YEAR(li.date_received) = :year";
            $params[':year'] = $year;
        }
        if ($month) {
            $where .= " AND MONTH(li.date_received) = :month";
            $params[':month'] = $month;
        }

        $q = "
            SELECT 
                li.id, li.letter_number, li.sender, li.recipient, li.subject,
                li.date_received AS tanggal_arsip, li.file_path,
                ks.nama_kategori,
                'masuk' AS jenis
            FROM letters_incoming li
            LEFT JOIN kategori_surat ks ON li.id_kategori = ks.id_kategori
            $where
            ORDER BY li.date_received DESC
        ";
        $stmt = $conn->prepare($q);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $rows, 'total' => count($rows)]);

    // ─── MODE: List Surat Keluar per Folder ──────────────────────────────────
    } elseif ($type === 'keluar') {
        $year  = isset($_GET['year'])  ? (int)$_GET['year']  : null;
        $month = isset($_GET['month']) ? (int)$_GET['month'] : null;

        $where = "WHERE lo.is_deleted = 0 AND lo.status IN ('Disetujui', 'Selesai')";
        $params = [];

        if ($year) {
            $where .= " AND YEAR(COALESCE(lo.date_sent, lo.created_at)) = :year";
            $params[':year'] = $year;
        }
        if ($month) {
            $where .= " AND MONTH(COALESCE(lo.date_sent, lo.created_at)) = :month";
            $params[':month'] = $month;
        }

        $q = "
            SELECT 
                lo.id, lo.letter_number, lo.sender, lo.recipient, lo.subject,
                COALESCE(lo.date_sent, lo.created_at) AS tanggal_arsip, lo.status,
                lt.name AS template_name,
                ks.nama_kategori,
                'keluar' AS jenis
            FROM letters_outgoing lo
            LEFT JOIN letter_templates lt ON lo.template_id = lt.id
            LEFT JOIN kategori_surat ks ON lo.id_kategori = ks.id_kategori
            $where
            ORDER BY tanggal_arsip DESC
        ";
        $stmt = $conn->prepare($q);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $rows, 'total' => count($rows)]);

    // ─── MODE: Semua Arsip (default jika tidak ada filter folder) ────────────
    } elseif ($type === 'all') {
        $q_masuk = "
            SELECT li.id, li.letter_number, li.sender, li.recipient, li.subject,
                   li.date_received AS tanggal_arsip, li.file_path,
                   ks.nama_kategori, 'masuk' AS jenis
            FROM letters_incoming li
            LEFT JOIN kategori_surat ks ON li.id_kategori = ks.id_kategori
            WHERE li.is_deleted = 0
            ORDER BY li.date_received DESC
            LIMIT 20
        ";
        $q_keluar = "
            SELECT lo.id, lo.letter_number, lo.sender, lo.recipient, lo.subject,
                   COALESCE(lo.date_sent, lo.created_at) AS tanggal_arsip, NULL AS file_path,
                   lt.name AS template_name,
                   ks.nama_kategori, 'keluar' AS jenis
            FROM letters_outgoing lo
            LEFT JOIN letter_templates lt ON lo.template_id = lt.id
            LEFT JOIN kategori_surat ks ON lo.id_kategori = ks.id_kategori
            WHERE lo.is_deleted = 0 AND lo.status IN ('Disetujui', 'Selesai')
            ORDER BY tanggal_arsip DESC
            LIMIT 20
        ";

        $stmt1 = $conn->prepare($q_masuk);
        $stmt1->execute();
        $masuk = $stmt1->fetchAll(PDO::FETCH_ASSOC);

        $stmt2 = $conn->prepare($q_keluar);
        $stmt2->execute();
        $keluar = $stmt2->fetchAll(PDO::FETCH_ASSOC);

        $combined = array_merge($masuk, $keluar);
        usort($combined, fn($a, $b) => strcmp($b['tanggal_arsip'] ?? '', $a['tanggal_arsip'] ?? ''));

        echo json_encode(['success' => true, 'data' => $combined, 'total' => count($combined)]);

    } else {
        echo json_encode(['success' => false, 'message' => 'Tipe tidak dikenal']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Method tidak diizinkan']);
}
?>
