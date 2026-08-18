<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
include_once 'config.php';

$stats = [
    'total_permohonan' => 0,
    'total_masuk' => 0,
    'total_keluar' => 0,
    'menunggu_persetujuan' => 0,
    'my_active_requests' => 0,
    'chart_data' => [],
    'activities' => []
];

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$role = isset($_GET['role']) ? $_GET['role'] : 'guru';

try {
    // Total Permohonan
    $q1 = "SELECT COUNT(*) as total FROM letter_requests WHERE is_deleted = 0";
    $stmt1 = $conn->query($q1);
    $stats['total_permohonan'] = (int)$stmt1->fetch(PDO::FETCH_ASSOC)['total'];

    // Total Surat Masuk
    $q2 = "SELECT COUNT(*) as total FROM letters_incoming WHERE is_deleted = 0";
    $stmt2 = $conn->query($q2);
    $stats['total_masuk'] = (int)$stmt2->fetch(PDO::FETCH_ASSOC)['total'];

    // Total Surat Keluar (Only Approved/Finished)
    $q3 = "SELECT COUNT(*) as total FROM letters_outgoing WHERE status IN ('Disetujui', 'Selesai') AND is_deleted = 0";
    $stmt3 = $conn->query($q3);
    $stats['total_keluar'] = (int)$stmt3->fetch(PDO::FETCH_ASSOC)['total'];

    // Menunggu Persetujuan (Hanya draf surat resmi yang diajukan ke Kepsek)
    $q4 = "SELECT COUNT(*) as total FROM letters_outgoing WHERE status = 'Menunggu Persetujuan' AND is_deleted = 0";
    $stmt4 = $conn->query($q4);
    $stats['menunggu_persetujuan'] = (int)$stmt4->fetch(PDO::FETCH_ASSOC)['total'];

    // My Active Requests
    if ($user_id) {
        $q5 = "SELECT COUNT(*) as total FROM letter_requests WHERE user_id = :user_id AND status NOT IN ('Selesai', 'Ditolak')";
        $stmt5 = $conn->prepare($q5);
        $stmt5->execute(['user_id' => $user_id]);
        $stats['my_active_requests'] = (int)$stmt5->fetch(PDO::FETCH_ASSOC)['total'];
    }

    // Chart Data (Starting from March 2026)
    $chart_data = [];
    $start_date = new DateTime('2026-04-01');
    $current_date = new DateTime('now');
    
    // Create a loop from start_date to current_date, limit to 6 months
    $interval = new DateInterval('P1M');
    $end_date = clone $start_date;
    $end_date->add(new DateInterval('P6M')); // Max 6 months from March
    
    $real_end = new DateTime('now');
    $real_end->modify('first day of next month');
    
    // If current date is beyond the 6-month window from March, we show the LAST 6 months
    // But the user said "dimulai dari Maret 2026", so we'll stick to that start if we are in early 2026.
    
    $period = new DatePeriod($start_date, $interval, min($end_date, $real_end));

    foreach ($period as $dt) {
        $month = $dt->format('m');
        $year = $dt->format('Y');
        $month_name = $dt->format('M');

        $qm = "SELECT COUNT(*) as total FROM letters_incoming WHERE MONTH(created_at) = :m AND YEAR(created_at) = :y AND is_deleted = 0";
        $stm = $conn->prepare($qm);
        $stm->execute(['m' => $month, 'y' => $year]);
        $masuk = (int)$stm->fetch(PDO::FETCH_ASSOC)['total'];

        $qk = "SELECT COUNT(*) as total FROM letters_outgoing WHERE MONTH(created_at) = :m AND YEAR(created_at) = :y AND status IN ('Disetujui', 'Selesai') AND is_deleted = 0";
        $stk = $conn->prepare($qk);
        $stk->execute(['m' => $month, 'y' => $year]);
        $keluar = (int)$stk->fetch(PDO::FETCH_ASSOC)['total'];

        $chart_data[] = [
            'name' => $month_name,
            'masuk' => $masuk,
            'keluar' => $keluar
        ];
    }
    $stats['chart_data'] = $chart_data;

    // Fetch Activities
    $activities = [];

    if ($role === 'kepala_sekolah') {
        // 1. Draft Surat Menunggu Approval (Prioritas Utama)
        $qa2 = "SELECT lo.subject, lo.created_at, u.full_name FROM letters_outgoing lo 
                LEFT JOIN letter_requests lr ON lo.request_id = lr.id 
                LEFT JOIN users u ON lr.user_id = u.id 
                WHERE lo.status = 'Menunggu Persetujuan' AND lo.is_deleted = 0 ORDER BY lo.created_at DESC LIMIT 10";
        $st2 = $conn->query($qa2);
        while($row = $st2->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'menunggu',
                'title' => "Draf Surat Keluar: " . $row['subject'],
                'subtitle' => "Menunggu persetujuan Anda (Diajukan oleh TU)",
                'time' => $row['created_at']
            ];
        }

        // 3. Riwayat Persetujuan / Penolakan (Activities by Principal)
        $qa3 = "SELECT subject, status, updated_at FROM letters_outgoing 
                WHERE status IN ('Disetujui', 'Ditolak') AND is_deleted = 0 ORDER BY updated_at DESC LIMIT 5";
        $st3 = $conn->query($qa3);
        while($row = $st3->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'keluar',
                'title' => "Surat " . $row['status'] . ": " . $row['subject'],
                'subtitle' => "Telah diproses oleh Anda",
                'time' => $row['updated_at']
            ];
        }

        // 4. Surat Masuk Baru
        $qa4 = "SELECT subject, sender, created_at FROM letters_incoming WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 5";
        $st4 = $conn->query($qa4);
        while($row = $st4->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'masuk',
                'title' => "Surat Masuk: " . $row['subject'],
                'subtitle' => "Dari: " . $row['sender'],
                'time' => $row['created_at']
            ];
        }
    } else if ($role === 'tata_usaha' || $role === 'admin') {
        // 1. New Permohonan from any user
        $qa1 = "SELECT lr.subject, lr.created_at, u.full_name FROM letter_requests lr 
                LEFT JOIN users u ON lr.user_id = u.id 
                ORDER BY lr.created_at DESC LIMIT 5";
        $st1 = $conn->query($qa1);
        while($row = $st1->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'menunggu',
                'title' => "Permohonan Masuk: " . $row['subject'],
                'subtitle' => "Dari: " . ($row['full_name'] ?? 'User'),
                'time' => $row['created_at']
            ];
        }

        // 2. Letters Approved/Rejected by Principal
        $qa2 = "SELECT subject, status, updated_at FROM letters_outgoing 
                WHERE status IN ('Disetujui', 'Ditolak') AND is_deleted = 0 ORDER BY updated_at DESC LIMIT 5";
        $st2 = $conn->query($qa2);
        while($row = $st2->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'keluar',
                'title' => "Status Approval: " . $row['subject'],
                'subtitle' => "Status: " . $row['status'] . " oleh Kepsek",
                'time' => $row['updated_at']
            ];
        }

        // 3. New Incoming Letters (Inputted by TU)
        $qa3 = "SELECT subject, sender, created_at FROM letters_incoming WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 5";
        $st3 = $conn->query($qa3);
        while($row = $st3->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'masuk',
                'title' => "Surat Masuk Baru: " . $row['subject'],
                'subtitle' => "Pengirim: " . $row['sender'],
                'time' => $row['created_at']
            ];
        }

        // 4. New Outgoing Drafts (Inputted by TU)
        $qa4 = "SELECT subject, created_at FROM letters_outgoing WHERE status = 'Draft' AND is_deleted = 0 ORDER BY created_at DESC LIMIT 5";
        $st4 = $conn->query($qa4);
        while($row = $st4->fetch(PDO::FETCH_ASSOC)) {
            $activities[] = [
                'type' => 'keluar',
                'title' => "Draft Surat Dibuat: " . $row['subject'],
                'subtitle' => "Disimpan sebagai draft",
                'time' => $row['created_at']
            ];
        }
    } else {
        // 1. My Letter Requests progress
        if ($user_id) {
            $qa1 = "SELECT subject, status, created_at FROM letter_requests WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 5";
            $st1 = $conn->prepare($qa1);
            $st1->execute(['user_id' => $user_id]);
            while($row = $st1->fetch(PDO::FETCH_ASSOC)) {
                $activities[] = [
                    'type' => $row['status'] === 'Selesai' ? 'keluar' : 'menunggu',
                    'title' => "Update Permohonan: " . $row['subject'],
                    'subtitle' => "Status saat ini: " . $row['status'],
                    'time' => $row['created_at']
                ];
            }
        }

        // 2. New Categories added by TU
        try {
            $qa2 = "SELECT nama_kategori, created_at FROM kategori_surat ORDER BY created_at DESC LIMIT 3";
            $st2 = $conn->query($qa2);
            if ($st2) {
                while($row = $st2->fetch(PDO::FETCH_ASSOC)) {
                    $activities[] = [
                        'type' => 'masuk',
                        'title' => "Kategori Baru: " . $row['nama_kategori'],
                        'subtitle' => "Telah ditambahkan oleh Tata Usaha",
                        'time' => $row['created_at']
                    ];
                }
            }
        } catch (Exception $e) {
            // Table might not exist yet
        }

        // 3. New Templates added by TU
        try {
            $qa3 = "SELECT name, created_at FROM letter_templates ORDER BY created_at DESC LIMIT 3";
            $st3 = $conn->query($qa3);
            if ($st3) {
                while($row = $st3->fetch(PDO::FETCH_ASSOC)) {
                    $activities[] = [
                        'type' => 'keluar',
                        'title' => "Template Baru: " . $row['name'],
                        'subtitle' => "Tersedia untuk pengajuan permohonan",
                        'time' => $row['created_at']
                    ];
                }
            }
        } catch (Exception $e) {
            // Table might not exist yet
        }
    }

    // Sort all activities by time DESC and humanize time
    usort($activities, function($a, $b) {
        return strtotime($b['time']) - strtotime($a['time']);
    });

    // Format subtitle for UI (Adding time ago style)
    foreach ($activities as &$act) {
        $time_ago = date("d M Y", strtotime($act['time']));
        $act['subtitle'] .= " - " . $time_ago;
    }

    $stats['activities'] = array_slice($activities, 0, 5); // Limit to top 5 after sorting

} catch (PDOException $e) {
    // Handle error if needed
}

header('Content-Type: application/json');
echo json_encode($stats);
