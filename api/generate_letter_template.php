<?php
include_once 'config.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $name = $data->name ?? '';
    $category = $data->category ?? '';
    $description = $data->description ?? '';

    if (empty($name) || empty($category)) {
        echo json_encode(["success" => false, "message" => "Nama template dan kategori wajib diisi."]);
        exit;
    }

    $apiKey = GEMINI_API_KEY;
    $model = "gemini-flash-latest";
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

    $prompt = "Tugas Anda adalah membuat format/draf isi surat resmi dalam Bahasa Indonesia yang profesional dan formal.
Input Detail:
- Nama Template: {$name}
- Kategori Surat: {$category}
- Deskripsi/Tujuan: {$description}

Instruksi Khusus:
1. JANGAN sertakan KOP SURAT (Header), TANGGAL, NOMOR SURAT, PENERIMA, atau TANDA TANGAN. Bagian-bagian ini sudah ada di sistem.
2. Fokus HANYA pada isi surat (body) dimulai dari 'Salam Pembuka' hingga sebelum 'Salam Penutup'.
3. Gunakan gaya bahasa yang sangat formal dan baku (EYD).
4. Jika kategori adalah 'Undangan', sertakan placeholder yang jelas untuk rincian acara (Hari/Tanggal, Waktu, Tempat, Acara).
5. Berikan output dalam format HTML (hanya tag <p>, <ul>, <li>, <strong>, <br>). JANGAN berikan markdown (seperti ```html).
6. Pastikan alur kalimat mengalir dengan baik dan profesional.
7. JANGAN berikan teks tambahan apapun di luar isi surat.

Contoh struktur yang diharapkan:
<p>Assalamu'alaikum Wr. Wb.</p>
<p>Dengan hormat,</p>
<p>Sehubungan dengan rencana pelaksanaan kegiatan [Sebutkan Kegiatan], maka bersama ini kami mengundang Bapak/Ibu untuk hadir pada:</p>
<ul>
  <li>Hari/Tanggal: [Hari/Tanggal]</li>
  <li>Waktu: [Waktu]</li>
  <li>Tempat: [Tempat]</li>
  <li>Acara: [Nama Acara]</li>
</ul>
<p>Mengingat pentingnya acara tersebut, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya.</p>
<p>Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.</p>";

    $payload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt]
                ]
            ]
        ],
        "generationConfig" => [
            "temperature" => 0.4
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
        $content = $result->candidates[0]->content->parts[0]->text ?? "Gagal men-generate draf surat.";
        
        // Clean up any potential markdown code blocks
        $content = str_replace(['```html', '```'], '', $content);
        
        echo json_encode(["success" => true, "content" => trim($content)]);
    } else {
        $errorMsg = "AI Error (Code: $httpCode)";
        $errorDetail = json_decode($response);
        if (isset($errorDetail->error->message)) {
            $errorMsg .= ": " . $errorDetail->error->message;
        }
        echo json_encode(["success" => false, "message" => $errorMsg, "raw" => $response]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
