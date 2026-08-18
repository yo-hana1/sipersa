<?php
$response = file_get_contents('http://localhost/siarsad/api/surat_keluar.php');
file_put_contents('api_response.json', $response);
echo "Done";
?>
