<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'POST') {
    // Check if file is uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] != 0) {
        echo json_encode(["success" => false, "message" => "Tidak ada file yang diunggah atau terjadi kesalahan."]);
        exit;
    }

    $file = $_FILES['file'];
    $fileTmpPath = $file['tmp_name'];
    $fileType = $file['type'];
    $fileData = base64_encode(file_get_contents($fileTmpPath));

    // Gemini API Configuration
    $apiKey = GEMINI_API_KEY;
    $model = "gemini-flash-latest";
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

    // Prepare Request Body
    $prompt = "Tolong analisis dokumen ini (hasil scan surat masuk). Cari informasi berikut:
               1. Nomor Surat (identitas unik surat)
               2. Perihal (tujuan/isi ringkas surat)
               3. Pengirim (instansi atau perorangan yang mengirim)
               4. Tanggal Surat (tanggal yang tertera pada surat, format YYYY-MM-DD jika memungkinkan)
               
               Kembalikan HANYA dalam format JSON dengan key: 'letter_number', 'subject', 'sender', dan 'date'. 
               Jangan memberikan penjelasan apapun, hanya kembalikan blok kode JSON.
               Jika informasi tidak ditemukan, biarkan string kosong.
               Contoh output: {\"letter_number\": \"123/EXT/V/2026\", \"subject\": \"Permohonan Kerjasama\", \"sender\": \"Dinas Pendidikan\", \"date\": \"2026-05-01\"}";

    $payload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => $prompt],
                    [
                        "inline_data" => [
                            "mime_type" => $fileType,
                            "data" => $fileData
                        ]
                    ]
                ]
            ]
        ]
    ];

    // Execute CURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    // Add these for debugging connectivity
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Bypass SSL check if cacert.pem is missing
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode([
            "success" => false, 
            "message" => "CURL Error: " . $curlError,
            "instruction" => "Pastikan ekstensi CURL aktif di PHP Laragon Anda."
        ]);
        exit;
    }

    if ($httpCode !== 200) {
        $err = json_decode($response);
        echo json_encode([
            "success" => false, 
            "message" => "AI Scanner Error: " . ($err->error->message ?? "Gagal menghubungi Gemini AI"),
            "debug_code" => $httpCode,
            "raw_response" => $response
        ]);
        exit;
    }

    $result = json_decode($response);
    if (!isset($result->candidates[0]->content->parts[0]->text)) {
        echo json_encode(["success" => false, "message" => "AI tidak memberikan respon teks yang valid."]);
        exit;
    }

    $textResponse = $result->candidates[0]->content->parts[0]->text;
    // Clean up markdown backticks if any
    $cleanJson = preg_replace('/```json\s*|\s*```/', '', $textResponse);
    $extractedData = json_decode(trim($cleanJson));

    if ($extractedData) {
        echo json_encode([
            "success" => true, 
            "message" => "Dokumen berhasil dipindai oleh Gemini AI.",
            "data" => [
                "letter_number" => $extractedData->letter_number ?? "",
                "subject" => $extractedData->subject ?? "",
                "sender" => $extractedData->sender ?? "",
                "date" => $extractedData->date ?? ""
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Gagal mengekstrak data dari respons AI.",
            "raw_response" => $textResponse
        ]);
    }

} else {
    echo json_encode(["success" => false, "message" => "Metode tidak diizinkan."]);
}
?>
