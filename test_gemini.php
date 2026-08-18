<?php
include_once 'config.php';

$apiKey = GEMINI_API_KEY;
$model = "gemini-flash-latest";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$prompt = "Buatkan HANYA SATU PARAGRAF narasi resmi (tanpa bullet points, tanpa judul) untuk pembukaan laporan inventarisasi persuratan. 
Di dalam paragraf tersebut, Anda WAJIB merangkai informasi berikut menjadi kalimat pasif yang formal dan mengalir:
- Jenis dokumen yang difilter: Surat Masuk
- Kategori surat yang difilter: kategori Izin
- Rentang waktu pencarian: dari tanggal 01 Mei 2026 sampai 05 Mei 2026
- Jumlah hasil: Ditemukan sebanyak 1 dokumen.

Contoh format kalimat (buat variasi Anda sendiri yang profesional): 'Berdasarkan prosedur penyaringan data pada sistem administrasi persuratan instansi, telah dilakukan inventarisasi terhadap Surat Masuk untuk kategori Undangan dalam rentang waktu dari tanggal 01 Mei 2026 sampai 05 Mei 2026. Dari proses tersebut, telah berhasil dihimpun sebanyak 5 dokumen yang sesuai dengan kriteria dan siap untuk dilampirkan dalam laporan ini.'

Ingat: HANYA berikan 1 teks paragraf saja tanpa tambahan apapun. Format kalimat harus pasif, formal, dan merangkum KEEMPAT poin informasi di atas.";

$payload = [
    "contents" => [
        [
            "parts" => [
                ["text" => $prompt]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.7,
        "maxOutputTokens" => 500
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
echo "RESPONSE:\n" . $response . "\n";
?>
