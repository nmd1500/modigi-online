<?php
// MODIGI お問い合わせフォーム送信 (Hostinger PHP mail)
declare(strict_types=1);

const TO_EMAIL   = 'modigijp@gmail.com';
const FROM_EMAIL = 'noreply@modigi.jp';   // Tạo hộp thư này trong hPanel → Emails để mail không bị vào spam
const SUBJECTS   = ['product' => '商品について', 'size' => 'サイズ・対応機種について', 'order' => 'ご注文・配送について', 'wholesale' => '法人・卸のご相談', 'other' => 'その他'];

function back(string $q): never {
    header('Location: ' . $q, true, 303);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') back('/contact/');

// Spam: honeypot + điền form quá nhanh (< 3 giây)
if (!empty($_POST['website'])) back('/contact/thanks/');
$ts = (int)($_POST['ts'] ?? 0);
if ($ts > 0 && (microtime(true) * 1000 - $ts) < 3000) back('/contact/thanks/');

// Giới hạn: 5 lần / 10 phút / IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$rlFile = sys_get_temp_dir() . '/modigi_rl_' . md5($ip);
$hits = array_filter((array)@json_decode((string)@file_get_contents($rlFile), true), fn($t) => $t > time() - 600);
if (count($hits) >= 5) back('/contact/?error=rate');
$hits[] = time();
@file_put_contents($rlFile, json_encode(array_values($hits)));

$clean = fn(string $k, int $max) => mb_substr(trim(str_replace(["\r", "\0"], '', (string)($_POST[$k] ?? ''))), 0, $max);
$name    = preg_replace('/[\n\t]+/', ' ', $clean('name', 100));
$email   = $clean('email', 200);
$topic   = SUBJECTS[$_POST['topic'] ?? ''] ?? SUBJECTS['other'];
$order   = preg_replace('/[\n\t]+/', ' ', $clean('order', 60));
$message = $clean('message', 5000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($_POST['consent'])) {
    back('/contact/?error=invalid');
}

$body = "MODIGI公式サイトからお問い合わせがありました。\n\n"
      . "お名前: {$name}\nメール: {$email}\n種別: {$topic}\n"
      . ($order !== '' ? "注文番号: {$order}\n" : '')
      . "\n----------\n{$message}\n----------\n\n"
      . 'IP: ' . $ip . "\n日時: " . date('Y-m-d H:i:s') . "\n";

$headers = [
    'From' => 'MODIGI Website <' . FROM_EMAIL . '>',
    'Reply-To' => $email,
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'MODIGI',
];

mb_language('uni');
mb_internal_encoding('UTF-8');
$subject = mb_encode_mimeheader('【MODIGI】' . $topic . ' - ' . $name, 'UTF-8');
$ok = mail(TO_EMAIL, $subject, $body, $headers, '-f' . FROM_EMAIL);

back($ok ? '/contact/thanks/' : '/contact/?error=send');
