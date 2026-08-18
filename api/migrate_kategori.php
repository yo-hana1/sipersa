<?php
include_once 'config.php';

try {
    $conn->beginTransaction();

    // 1. Create table
    $query = "CREATE TABLE IF NOT EXISTS kategori_surat (
        id_kategori INT AUTO_INCREMENT PRIMARY KEY,
        nama_kategori VARCHAR(100) NOT NULL UNIQUE,
        deskripsi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB";
    $conn->exec($query);
    echo "Table 'kategori_surat' created successfully.<br>";

    // 2. Seed data
    $seedData = [
        ['Pemberitahuan', 'Digunakan untuk menyampaikan informasi kepada orang tua atau pihak tertentu'],
        ['Undangan', 'Digunakan untuk mengundang pihak tertentu dalam suatu kegiatan'],
        ['Izin', 'Digunakan untuk memberikan atau meminta izin'],
        ['Keterangan', 'Berisi keterangan resmi dari sekolah seperti keterangan siswa aktif'],
        ['Tugas', 'Digunakan untuk penugasan kepada guru atau staf'],
        ['Permohonan', 'Digunakan untuk mengajukan permintaan kepada pihak luar'],
        ['Keputusan', 'Surat resmi berisi keputusan dari kepala sekolah']
    ];

    $checkQuery = "SELECT COUNT(*) FROM kategori_surat";
    $count = $conn->query($checkQuery)->fetchColumn();

    if ($count == 0) {
        $insertQuery = "INSERT INTO kategori_surat (nama_kategori, deskripsi) VALUES (:nama, :desc)";
        $stmt = $conn->prepare($insertQuery);
        
        foreach ($seedData as $data) {
            $stmt->execute([':nama' => $data[0], ':desc' => $data[1]]);
        }
        echo "Default data seeded successfully.<br>";
    }

    // 3. Add id_kategori to existing tables if not exists
    $tablesToUpdate = ['letter_templates', 'letters_incoming', 'letters_outgoing'];
    
    foreach ($tablesToUpdate as $table) {
        // Check if column exists
        $checkCol = $conn->query("SHOW COLUMNS FROM $table LIKE 'id_kategori'");
        if ($checkCol->rowCount() == 0) {
            $conn->exec("ALTER TABLE $table ADD COLUMN id_kategori INT NULL AFTER id");
            $conn->exec("ALTER TABLE $table ADD CONSTRAINT FK_{$table}_kategori FOREIGN KEY (id_kategori) REFERENCES kategori_surat(id_kategori) ON DELETE SET NULL");
            echo "Added 'id_kategori' to table '$table'.<br>";
        }
    }

    $conn->commit();
    echo "Migration completed successfully.";

} catch (Exception $e) {
    $conn->rollBack();
    echo "Error: " . $e->getMessage();
}
?>
