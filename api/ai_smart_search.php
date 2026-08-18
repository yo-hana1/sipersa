<?php
include_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit;
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $query = $data->query ?? '';

    if (empty($query)) {
        echo json_encode(["success" => false, "message" => "Query pencarian tidak boleh kosong."]);
        exit;
    }

    // 1. Fetch all letter subjects/numbers for context
    // We fetch from both surat_masuk and letters_outgoing
    $stmt1 = $conn->prepare("SELECT id, 'masuk' as type, letter_number, subject, sender as person, date_received as date FROM surat_masuk WHERE is_deleted = 0");
    $stmt1->execute();
    $masuk = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $conn->prepare("SELECT id, 'keluar' as type, letter_number, subject, recipient as person, date_sent as date FROM letters_outgoing WHERE is_deleted = 0");
    $stmt2->execute();
    $keluar = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $all_records = array_merge($masuk, $keluar);
    
    // Prepare a list for AI to analyze (limited to top 200 for token limits)
    $context_list = array_slice($all_records, 0, 200);
    $formatted_list = "";
    foreach($context_list as $index => $rec) {
        $formatted_list .= "[ID:{$index}] Type:{$rec['type']} | No:{$rec['letter_number']} | Subj:{$rec['subject']} | Person:{$rec['person']} | Date:{$rec['date']}\n";
    }

    // 2. Contact Gemini
    $apiKey = GEMINI_API_KEY;
    $model = "gemini-flash-latest";
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

    $prompt = "Tolong bantu saya mencari surat dalam arsip sekolah berdasarkan kueri bahasa alami.
               Kueri User: \"{$query}\"
               
               Berikut adalah daftar arsip yang tersedia:
               {$formatted_list}
               
               Tolong identifikasi arsip mana yang paling relevan dengan kueri tersebut (bisa lebih dari satu).
               Kembalikan respon HANYA dalam format JSON berupa array dari ID yang ditemukan (indeks dari daftar di atas).
               Contoh output: [2, 5, 12]
               Jangan berikan penjelasan apapun.";

    $payload = [
        "contents" => [
            ["parts" => [["text" => $prompt]]]
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Bypass SSL check for local dev
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        echo json_encode(["success" => false, "message" => "CURL Error: " . $curlError]);
        exit;
    }

    if ($httpCode !== 200) {
        echo json_encode(["success" => false, "message" => "Gagal menghubungi AI Search.", "raw" => $response]);
        exit;
    }

    $result = json_decode($response);
    $textResponse = $result->candidates[0]->content->parts[0]->text ?? '[]';
    $cleanJson = preg_replace('/```json\s*|\s*```/', '', $textResponse);
    $relevantIndices = json_decode(trim($cleanJson));

    if (is_array($relevantIndices)) {
        $searchResults = [];
        foreach($relevantIndices as $idx) {
            if (isset($context_list[$idx])) {
                $searchResults[] = $context_list[$idx];
            }
        }

        echo json_encode([
            "success" => true,
            "data" => $searchResults
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "AI tidak menemukan hasil yang cocok.", "debug" => $textResponse]);
    }

} else {
    echo json_encode(["success" => false, "message" => "Metode tidak diizinkan."]);
}
?>
