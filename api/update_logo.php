<?php
include_once 'config.php';

try {
    // 1. Update letter_templates
    $q1 = "UPDATE letter_templates SET content = REPLACE(content, 'logorestu2.png', 'logo-dwp.png')";
    $conn->exec($q1);
    
    // 2. Update letters_outgoing
    $q2 = "UPDATE letters_outgoing SET draft_data = REPLACE(draft_data, 'logorestu2.png', 'logo-dwp.png')";
    $conn->exec($q2);
    
    echo json_encode(["success" => true, "message" => "Database updated with new logo path successfully."]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
