<?php
include_once 'api/config.php';

$templates = [
    [
        'name' => 'Surat Permohonan Narasumber',
        'type' => 'narasumber',
        'number_format' => 'PMN/Restu2/[YEAR]/[MONTH]/[SEQ]',
        'content' => '<p>Dengan hormat,</p><p>Sehubungan dengan pelaksanaan kegiatan...</p>'
    ],
    [
        'name' => 'Surat Peminjaman',
        'type' => 'peminjaman',
        'number_format' => 'PNJ/Restu2/[YEAR]/[MONTH]/[SEQ]',
        'content' => '<p>Dalam rangka kegiatan...</p>'
    ],
    [
        'name' => 'Surat Keterangan Aktif',
        'type' => 'keterangan_aktif',
        'number_format' => '[SEQ]/PAUD-R2/SKA/[MONTH]/[YEAR]',
        'content' => '<p>Menerangkan bahwa...</p>'
    ],
    [
        'name' => 'Surat Tugas',
        'type' => 'tugas',
        'number_format' => '[SEQ]/PAUD-R2/ST/[MONTH]/[YEAR]',
        'content' => '<p>Menugaskan kepada...</p>'
    ],
    [
        'name' => 'Surat Undangan',
        'type' => 'undangan',
        'number_format' => 'UND/KB-BA-TPA Restu 2/[YEAR]/[MONTH]/[SEQ]',
        'content' => '<p>Mengundang Bapak/Ibu untuk hadir pada...</p>'
    ],
    [
        'name' => 'Surat Keterangan',
        'type' => 'keterangan',
        'number_format' => '[SEQ]/PAUD-R2/SK/[MONTH]/[YEAR]',
        'content' => '<p>Menerangkan dengan sesungguhnya bahwa...</p>'
    ]
];

foreach ($templates as $t) {
    // Check if exists
    $stmt = $conn->prepare("SELECT id FROM letter_templates WHERE name = :name");
    $stmt->execute([':name' => $t['name']]);
    $exists = $stmt->fetch();

    if ($exists) {
        $update = $conn->prepare("UPDATE letter_templates SET type = :type, number_format = :nf, content = :content WHERE id = :id");
        $update->execute([
            ':type' => $t['type'],
            ':nf' => $t['number_format'],
            ':content' => $t['content'],
            ':id' => $exists['id']
        ]);
        echo "Updated: " . $t['name'] . "\n";
    } else {
        $insert = $conn->prepare("INSERT INTO letter_templates (name, type, number_format, content) VALUES (:name, :type, :nf, :content)");
        $insert->execute([
            ':name' => $t['name'],
            ':type' => $t['type'],
            ':nf' => $t['number_format'],
            ':content' => $t['content']
        ]);
        echo "Inserted: " . $t['name'] . "\n";
    }
}
echo "Done.\n";
?>
