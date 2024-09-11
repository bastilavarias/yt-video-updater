<?php
require_once 'vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();


function getVideoDetails($videoId) {
    $apiKey = $_ENV['GOOGLE_API_KEY'];
    $client = new Google_Client();
    $client->setApplicationName('YouTube Video Details');
    $client->setScopes(Google_Service_YouTube::YOUTUBE_FORCE_SSL);
    $client->setAuthConfig('ytvu-client-secret.json');
    $client->setAccessType('offline');
    $client->setDeveloperKey($apiKey);

    if (file_exists('ytvu-refresh-token.json')) {
        $accessToken = json_decode(file_get_contents('ytvu-refresh-token.json'), true);
        $client->setAccessToken($accessToken);
    }

    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
        } else {
            $authUrl = $client->createAuthUrl();
            echo "Open this URL in your browser to authenticate:\n$authUrl\n";
            echo "Enter the authorization code: ";
            $authCode = trim(fgets(STDIN));
            $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
            $client->setAccessToken($accessToken);
            file_put_contents('ytvu-refresh-token.json', json_encode($accessToken));
        }
    }

    $youtube = new Google_Service_YouTube($client);

    try {
        $response = $youtube->videos->listVideos('snippet,contentDetails,statistics', [
            'id' => $videoId
        ]);
        if (empty($response['items'])) {
            echo "No video found with ID: " . $videoId . "\n";
        } else {
            $video = $response['items'][0];
            updateVideoDetails($videoId, $video['statistics']['viewCount']);
        }
    } catch (Google_Service_Exception $e) {
        echo 'A service error occurred: ' . $e->getMessage();
    } catch (Google_Exception $e) {
        echo 'An error occurred: ' . $e->getMessage();
    }
}

function updateVideoDetails($videoId, $views) {
    $url = $_ENV['PROCESSOR_URL'] . '/';
    $clientSecret = file_get_contents('ytvu-refresh-token.json');
    $headers = [
        "google-client-secret: $clientSecret"
    ];
    $data = [
        'video_id' => $videoId,
        'views' => $views
    ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Curl error: ' . curl_error($ch);
    }
    curl_close($ch);

    return $response;
}



$videoId = 'nGvdHESlRwc';
getVideoDetails($videoId);
?>