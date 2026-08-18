<?php
include_once 'api/config.php';

try {
    // We want: Pemberitahuan, Undangan, Izin, Keterangan, Tugas, Permohonan, Keputusan
    $valid_categories = ['Pemberitahuan', 'Undangan', 'Izin', 'Keterangan', 'Tugas', 'Permohonan', 'Keputusan'];
    
    $stmt = $conn->query("SELECT nama_kategori FROM kategori_surat");
    $existing = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($valid_categories as $cat) {
        if (!in_array($cat, $existing)) {
            $insert = $conn->prepare("INSERT INTO kategori_surat (nama_kategori) VALUES (?)");
            $insert->execute([$cat]);
            echo "Inserted category: $cat\n";
        }
    }

    echo "Database sync complete. Categories updated.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
