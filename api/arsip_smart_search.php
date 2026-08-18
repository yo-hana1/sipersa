<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method !== 'POST') {
    echo json_encode(["success" => false, "message" => "Method tidak diizinkan."]);
    exit;
}

$data  = json_decode(file_get_contents("php://input"));
$query = trim($data->query ?? '');

if (empty($query)) {
    echo json_encode(["success" => false, "message" => "Query pencarian tidak boleh kosong."]);
    exit;
}

// ── 1. Ambil semua arsip dari kedua tabel ─────────────────────────────────────
$stmt_masuk = $conn->prepare("
    SELECT
        li.id,
        'masuk' AS jenis,
        li.letter_number,
        li.subject,
        li.sender   AS person,
        li.date_received AS tanggal,
        ks.nama_kategori
    FROM letters_incoming li
    LEFT JOIN kategori_surat ks ON li.id_kategori = ks.id_kategori
    WHERE li.is_deleted = 0
    ORDER BY li.date_received DESC
    LIMIT 150
");
$stmt_masuk->execute();
$records_masuk = $stmt_masuk->fetchAll(PDO::FETCH_ASSOC);

$stmt_keluar = $conn->prepare("
    SELECT
        lo.id,
        'keluar' AS jenis,
        lo.letter_number,
        lo.subject,
        lo.recipient AS person,
        COALESCE(lo.date_sent, lo.created_at) AS tanggal,
        lo.sender,
        COALESCE(lo.date_sent, lo.created_at) AS tanggal_arsip,
        lo.status,
        lo.file_path,
        lt.name AS template_name,
        ks.nama_kategori
    FROM letters_outgoing lo
    LEFT JOIN letter_templates lt ON lo.template_id = lt.id
    LEFT JOIN kategori_surat ks ON lo.id_kategori = ks.id_kategori
    WHERE lo.is_deleted = 0 AND lo.status IN ('Disetujui', 'Selesai')
    ORDER BY tanggal DESC
    LIMIT 150
");
$stmt_keluar->execute();
$records_keluar = $stmt_keluar->fetchAll(PDO::FETCH_ASSOC);

// Tambahkan field tanggal_arsip ke masuk juga agar konsisten
foreach ($records_masuk as &$r) {
    $r['tanggal_arsip'] = $r['tanggal'];
    $r['file_path'] = null;
    $r['sender'] = $r['person'];
    $r['recipient'] = null;
}
unset($r);

$all_records   = array_merge($records_masuk, $records_keluar);
$context_list  = array_slice($all_records, 0, 200);

// ── 2. Format konteks untuk Gemini ───────────────────────────────────────────
$formatted = "";
foreach ($context_list as $idx => $rec) {
    $formatted .= "[IDX:{$idx}] Jenis:{$rec['jenis']} | No:{$rec['letter_number']} | Perihal:{$rec['subject']} | Person:{$rec['person']} | Kategori:{$rec['nama_kategori']} | Tgl:{$rec['tanggal']}\n";
}

// ── 3. Kirim ke Gemini ────────────────────────────────────────────────────────
$apiKey = GEMINI_API_KEY;
$model  = "gemini-1.5-flash";
$url    = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$prompt = <<<PROMPT
Kamu adalah asisten pencarian arsip surat sekolah. Tugasmu adalah menemukan arsip yang relevan berdasarkan narasi/deskripsi dari pengguna.

Kueri pengguna: "{$query}"

Daftar arsip yang tersedia:
{$formatted}

Analisis kueri dengan mempertimbangkan:
- Jenis surat (masuk/keluar)
- Perihal atau topik surat
- Nama pengirim/penerima
- Kategori surat
- Rentang waktu yang disebutkan (misalnya "bulan lalu", "April", "minggu ini")
- Kata kunci lain yang relevan

Kembalikan HANYA array JSON berisi angka IDX yang paling relevan. Format: [0, 3, 12]
Jangan sertakan penjelasan apapun, hanya array JSON.
PROMPT;

$payload = [
    "contents" => [
        ["parts" => [["text" => $prompt]]]
    ],
    "generationConfig" => [
        "temperature" => 0.1,
        "maxOutputTokens" => 256
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    echo json_encode(["success" => false, "message" => "CURL Error: " . $curlError]);
    exit;
}

if ($httpCode !== 200) {
    $errBody = json_decode($response);
    $errMsg  = $errBody->error->message ?? "HTTP {$httpCode}";
    echo json_encode(["success" => false, "message" => "Gagal menghubungi Gemini AI: " . $errMsg]);
    exit;
}

$result       = json_decode($response);
$textResponse = $result->candidates[0]->content->parts[0]->text ?? '[]';
$cleanJson    = preg_replace('/```json\s*|\s*```/', '', trim($textResponse));
$indices      = json_decode($cleanJson);

if (!is_array($indices) || count($indices) === 0) {
    echo json_encode([
        "success" => true,
        "data"    => [],
        "message" => "AI tidak menemukan arsip yang relevan dengan pencarian tersebut."
    ]);
    exit;
}

// ── 4. Kembalikan record yang relevan ─────────────────────────────────────────
$results = [];
foreach ($indices as $idx) {
    if (isset($context_list[$idx])) {
        $results[] = $context_list[$idx];
    }
}

echo json_encode([
    "success" => true,
    "data"    => $results,
    "total"   => count($results)
]);
?>
