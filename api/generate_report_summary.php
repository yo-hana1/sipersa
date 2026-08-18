<?php
include_once 'config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $type = $data->type ?? 'semua';
    $nama_kategori = $data->nama_kategori ?? 'Semua Kategori';
    $start_date = $data->start_date ?? '';
    $end_date = $data->end_date ?? '';
    $total_data = $data->total_data ?? 0;

    $apiKey = GEMINI_API_KEY;
    $model = "gemini-flash-latest";
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

    $date_info = "";
    if ($start_date && $end_date) {
        $date_info = "dalam rentang waktu dari tanggal " . date('d M Y', strtotime($start_date)) . " sampai " . date('d M Y', strtotime($end_date));
    } elseif ($start_date) {
        $date_info = "sejak tanggal " . date('d M Y', strtotime($start_date));
    } elseif ($end_date) {
        $date_info = "hingga tanggal " . date('d M Y', strtotime($end_date));
    }

    $prompt = "Buatkan HANYA SATU PARAGRAF pengantar laporan resmi instansi (tanpa bullet points, tanpa judul).
Laporan ini berisi rekapitulasi data administrasi persuratan.
Paragraf harus merangkai 4 poin informasi berikut menjadi kalimat yang formal, natural (manusiawi), dan TIDAK kaku:
- Cakupan dokumen: " . ($type == 'semua' ? 'Surat Masuk dan Surat Keluar' : ($type == 'masuk' ? 'Surat Masuk' : 'Surat Keluar')) . "
- Kategori surat: " . ($nama_kategori == 'Semua Kategori' ? 'seluruh kategori persuratan' : 'kategori ' . $nama_kategori) . "
- Periode laporan: " . ($date_info == '' ? 'keseluruhan waktu' : $date_info) . "
- Total data: " . $total_data . " dokumen.

PENTING: JANGAN gunakan frasa kaku yang terkesan seperti mesin (misalnya 'melalui proses penyaringan', 'berdasarkan kriteria yang ditetapkan', atau 'dihimpun secara formal'). Buatlah senatural mungkin, seolah ini adalah kalimat pengantar dari staf tata usaha di dalam dokumen tertulis.

Contoh gaya bahasa yang diharapkan (buat variasi Anda sendiri): 'Laporan ini menyajikan rekapitulasi administrasi Surat Masuk untuk kategori Undangan yang tercatat dalam rentang waktu dari tanggal 01 Mei 2026 sampai dengan 05 Mei 2026. Secara keseluruhan, terdapat 5 dokumen persuratan yang telah dibukukan dan dirincikan ke dalam daftar berikut.'

Ingat: HANYA berikan 1 paragraf utuh (justified format) tanpa tambahan teks apapun.";

    $payload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature" => 0.7
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $result = json_decode($response);
        $summary = $result->candidates[0]->content->parts[0]->text ?? "Gagal men-generate narasi.";
        echo json_encode(["success" => true, "summary" => trim($summary)]);
    } else {
        echo json_encode(["success" => false, "message" => "AI Error", "raw" => $response]);
    }
}
?>
