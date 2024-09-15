<?php
require_once 'vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

/*
 * @description This function retrieves video details such as view count, like count, and comment count from the YouTube Data API
 * using the provided video ID. It utilizes Google's OAuth authentication with a service account to access the YouTube API,
 * handling access token refresh if necessary. Once authenticated, it fetches the video's snippet, content details,
 * and statistics, and passes the relevant data to the updateVideoDetails function.
 *
 * @param string $videoId The ID of the YouTube video for which details are being fetched.
 */
function getVideoDetails($videoId) {
    $apiKey = $_ENV['GOOGLE_API_KEY'];
    $client = new Google_Client();
    $client->setApplicationName('YouTube Video Details');
    $client->setScopes(Google_Service_YouTube::YOUTUBE_FORCE_SSL);
    $client->setAuthConfig(__DIR__ . '/ytvu-client-secret.json');
    $client->setAccessType('offline');
    $client->setDeveloperKey($apiKey);

    if (file_exists(__DIR__ . '/ytvu-refresh-token.json')) {
        $accessToken = json_decode(file_get_contents(__DIR__ . '/ytvu-refresh-token.json'), true);
        $client->setAccessToken($accessToken);
    }

    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $accessToken = $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
            $client->setAccessToken($accessToken);
            file_put_contents(__DIR__ . '/ytvu-refresh-token.json', json_encode($accessToken));
        } else {
            $authUrl = $client->createAuthUrl();
            echo "Open this URL in your browser to authenticate:\n$authUrl\n";
            echo "Enter the authorization code: ";
            $authCode = trim(fgets(STDIN));
            $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
            $client->setAccessToken($accessToken);
            file_put_contents(__DIR__ . '/ytvu-refresh-token.json', json_encode($accessToken));
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
            $details = [
                'video_id' => $videoId,
                'views' => $video['statistics']['viewCount'],
                'likes' => $video['statistics']['likeCount'],
                'comments' => $video['statistics']['commentCount'],

            ];
            updateVideoDetails($details);
        }
    } catch (Google_Service_Exception $e) {
        echo 'A service error occurred: ' . $e->getMessage();
    } catch (Google_Exception $e) {
        echo 'An error occurred: ' . $e->getMessage();
    }
}

/*
 * @description This function sends a POST request to an external processor URL to update video details (such as video ID, views, likes, and comments).
 * The function retrieves the Google API refresh token from a local file and includes it as a header in the request. The video details are passed as
 * form data, and the response from the server is returned. If a cURL error occurs during the request, it outputs the error message.
 *
 * @param array $details An associative array containing video details, including 'video_id', 'views', 'likes', and 'comments'.
 * @return string The response from the processor URL after submitting the video details.
 */
function updateVideoDetails($details) {
    $url = $_ENV['PROCESSOR_URL'] . '/';
    $refreshToken = file_get_contents(__DIR__ . '/ytvu-refresh-token.json');
    $headers = [
        "google-refresh-token: $refreshToken"
    ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($details));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Curl error: ' . curl_error($ch);
    }
    curl_close($ch);

    return $response;
}

$videoId = $_ENV['YOUTUBE_VIDEO_ID'];
getVideoDetails($videoId);
?>