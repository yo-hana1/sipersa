<?php
include_once 'config.php';

$template_id = $_GET['template_id'] ?? null;

if (!$template_id) {
    echo json_encode(["error" => "Template ID required"]);
    exit;
}

// 1. Get template format and category name
$query = "SELECT lt.number_format, ks.nama_kategori 
          FROM letter_templates lt 
          LEFT JOIN kategori_surat ks ON lt.id_kategori = ks.id_kategori 
          WHERE lt.id = :id";
$stmt = $conn->prepare($query);
$stmt->bindParam(':id', $template_id);
$stmt->execute();
$template = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$template) {
    echo json_encode(["error" => "Template not found"]);
    exit;
}

$format = $template['number_format'];
$category_name = $template['nama_kategori'] ?? 'SURAT';

// 2. Determine current month and year
$month = date('m');
$year = date('Y');

// Category Code (First 3-4 letters uppercase)
$cat_code = strtoupper(substr($category_name, 0, 3));
$roman_months = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
$month_roman = $roman_months[(int)$month - 1];
$day = date('d');

// 3. Find the latest sequence by looking at the prefix of the format
// First, create a search pattern based on the static part of the format before [SEQ]
$prefix_part = explode('[SEQ', $format)[0];
$search_prefix = str_replace(
    ['[MONTH]', '[MM]', '[YEAR]', '[YYYY]', '[DD]', '[CAT]', '[CATEGORY]', '[TAHUN]', '[BULAN]'], 
    [$month_roman, $month, $year, $year, $day, $cat_code, strtoupper($category_name), $year, $month], 
    $prefix_part
);

$query = "SELECT letter_number FROM letters_outgoing 
          WHERE letter_number LIKE :prefix 
          AND MONTH(created_at) = :month 
          AND YEAR(created_at) = :year 
          ORDER BY id DESC LIMIT 1";

$stmt = $conn->prepare($query);
$stmt->execute([
    ':prefix' => $search_prefix . '%',
    ':month' => $month,
    ':year' => $year
]);
$last_letter = $stmt->fetch(PDO::FETCH_ASSOC);

// Determine where [SEQ...] is in the format to extract it correctly
$seq = 1001; // Default start

// Check if format has custom start like [SEQ start from 1001]
if (preg_match('/\[SEQ.*?(\d+)\]/i', $format, $m)) {
    $seq = (int)$m[1];
}
$custom_start = $seq;

if ($last_letter) {
    $format_parts = explode('/', $format);
    
    $seq_index = -1;
    foreach ($format_parts as $index => $part) {
        if (preg_match('/\[SEQ/i', $part)) {
            $seq_index = $index;
            break;
        }
    }
    
    $last_parts = explode('/', $last_letter['letter_number']);
    
    if ($seq_index !== -1 && isset($last_parts[$seq_index])) {
        // Extract sequence from the exact position
        $parsed_seq = (int)preg_replace('/[^0-9]/', '', $last_parts[$seq_index]);
        if ($parsed_seq > 0) {
            $seq = $parsed_seq + 1;
        }
    } else {
        // Fallback: look at the last part
        $last_element = end($last_parts);
        if (is_numeric($last_element)) {
            $seq = (int)$last_element + 1;
        }
    }
}

$final_number = str_replace(
    ['[MONTH]', '[MM]', '[YEAR]', '[YYYY]', '[DD]', '[CAT]', '[CATEGORY]', '[TAHUN]', '[BULAN]'], 
    [$month_roman, $month, $year, $year, $day, $cat_code, strtoupper($category_name), $year, $month], 
    $format
);

// Replace any variation of [SEQ...] with the sequence number
$final_number = preg_replace('/\[SEQ[^\]]*\]/i', $seq, $final_number);

echo json_encode([
    "next_number" => $final_number,
    "seq" => $seq,
    "category" => $category_name
]);
?>
