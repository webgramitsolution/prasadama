<?php
/**
 * SMTP Mailer Bridge for Restricted Environments
 * 
 * Usage:
 * 1. Upload this file to your Hostinger server (e.g., as mailer.php).
 * 2. Set the MAIL_BRIDGE_URL secret in Lovable Cloud to point to this file.
 * 3. Set the MAIL_BRIDGE_TOKEN secret in Lovable Cloud to match the TOKEN below.
 */

// --- CONFIGURATION ---
// Set a strong random token to prevent unauthorized usage
$SECRET_TOKEN = "CHANGEME_OR_USE_SECURE_TOKEN"; 

// Hostinger SMTP Settings
$SMTP_HOST = "smtp.hostinger.com";
$SMTP_PORT = 465; // SSL
$SMTP_USER = "sales@houskase.com"; // Must match your MAIL_FROM
$SMTP_PASS = "YOUR_SMTP_PASSWORD";
// --- END CONFIGURATION ---

header('Content-Type: application/json');

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON input"]);
    exit;
}

// Basic Token Auth
$receivedToken = isset($data['token']) ? $data['token'] : '';
if (empty($SECRET_TOKEN) || $receivedToken !== $SECRET_TOKEN) {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized access"]);
    exit;
}

$to = isset($data['to']) ? $data['to'] : '';
$subject = isset($data['subject']) ? $data['subject'] : 'Verify your Account';
$messageContent = isset($data['message']) ? $data['message'] : '';
$fullName = isset($data['fullName']) ? $data['fullName'] : 'User';

if (empty($to) || empty($messageContent)) {
    http_response_code(400);
    echo json_encode(["error" => "Recipient and message content are required"]);
    exit;
}

// Prepare HTML Email
$logoUrl = "https://id-preview--4d51562e-e0ab-4432-8eef-9c0eeece0a1e.lovable.app/__l5e/assets-v1/d790c6ca-3f3e-4a9a-a2eb-aa297ef27f6b/prasadam-logo-transparent.png";
$headerBg = "#001B3D";
$footerBg = "#ad1e2a";

$html = "
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
    .header { background-color: $headerBg; padding: 25px; }
    .logo { height: 45px; }
    .body { padding: 40px; text-align: center; }
    .otp-code { display: inline-block; padding: 15px 30px; background-color: #f0f4f8; color: #AD1E2A; font-size: 32px; font-weight: 700; border-radius: 8px; margin: 25px 0; letter-spacing: 5px; }
    .footer { background-color: $footerBg; color: #ffffff; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'><img src='$logoUrl' alt='Prasadam' class='logo'></div>
    <div class='body'>
      <h2>Account Verification</h2>
      <p>Hi <strong>$fullName</strong>,</p>
      <p>$messageContent</p>
    </div>
    <div class='footer'>
      <p>&copy; " . date("Y") . " Prasadam International. All rights reserved.</p>
    </div>
  </div>
</body>
</html>";

// Headers for HTML mail
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=utf-8';
$headers[] = 'From: Prasadam <' . $SMTP_USER . '>';

// Note: PHP mail() uses the server's local sendmail by default. 
// If you must use external SMTP, consider using PHPMailer instead of this basic script.
// However, Hostinger's local mail() is usually configured to work from their hosting.

if (mail($to, $subject, $html, implode("\r\n", $headers))) {
    echo json_encode(["status" => "success", "message" => "Email sent"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Internal mail function failed"]);
}
