<?php
require_once 'vendor/autoload.php';

function getVideoDetails($videoId) {
    $apiKey = 'AIzaSyDPw6sIn7qjLn3SFf-SwjCUVUrK4e47sjk';
    $client = new Google_Client();
    $client->setApplicationName('YouTube Video Details');
    $client->setScopes(Google_Service_YouTube::YOUTUBE_FORCE_SSL);
    $client->setAuthConfig('ytvu-client-secret.json');
    $client->setAccessType('offline');
    $client->setDeveloperKey($apiKey);
    $youtube = new Google_Service_YouTube($client);

    try {
        $response = $youtube->videos->listVideos('snippet,contentDetails,statistics', [
            'id' => $videoId
        ]);
        if (empty($response['items'])) {
            echo "No video found with ID: " . $videoId . "\n";
        } else {
            $video = $response['items'][0];
//            echo "Title: " . $video['snippet']['title'] . "\n";
//            echo "Description: " . $video['snippet']['description'] . "\n";
//            echo "View Count: " . $video['statistics']['viewCount'] . "\n";
//            echo "Likes: " . $video['statistics']['likeCount'] . "\n";
//            echo "Duration: " . $video['contentDetails']['duration'] . "\n";

            $viewCount = $video['statistics']['viewCount'];
            updateVideoDetails($videoId, $video['snippet']['title'] . ' ' . $viewCount);
        }
    } catch (Google_Service_Exception $e) {
        echo 'A service error occurred: ' . $e->getMessage();
    } catch (Google_Exception $e) {
        echo 'An error occurred: ' . $e->getMessage();
    }
}

function updateVideoDetails($videoId, $newTitle) {
    $apiKey = 'AIzaSyDPw6sIn7qjLn3SFf-SwjCUVUrK4e47sjk';
    $client = new Google_Client();
    $client->setApplicationName('YouTube Video Details');
    $client->setScopes(Google_Service_YouTube::YOUTUBE_FORCE_SSL);
    $client->setAuthConfig('ytvu-client-secret.json');
    $client->setAccessType('offline');
    $client->setDeveloperKey($apiKey);

    if (file_exists('token.json')) {
        $accessToken = json_decode(file_get_contents('token.json'), true);
        $client->setAccessToken($accessToken);
    }

    if ($client->isAccessTokenExpired()) {
        if ($client->getRefreshToken()) {
            $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
        } else {
            // Request a new access token
            $authUrl = $client->createAuthUrl();
            echo "Open this URL in your browser to authenticate:\n$authUrl\n";
            echo "Enter the authorization code: ";
            $authCode = trim(fgets(STDIN));

            // Exchange authorization code for access token
            $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
            $client->setAccessToken($accessToken);

            // Save the token to a file for future use
            file_put_contents('token.json', json_encode($accessToken));
        }
    }

    $youtube = new Google_Service_YouTube($client);

    try {
        $listResponse  = $youtube->videos->listVideos('snippet', ['id' => $videoId]);

        if (empty($listResponse['items'])) {
            echo "No video found with ID: " . $videoId . "\n";
            return;
        }

        $video = $listResponse['items'][0];
        $videoSnippet = $video['snippet'];
        createJsonFile($videoSnippet, 'videosnippet.json');
        $videoSnippet['title'] = $newTitle;
        $videoSnippet['tags'] = null;
        $updatedVideo = new Google_Service_YouTube_Video();
        $updatedVideo->setId($videoId);
        $updatedVideo->setSnippet($videoSnippet);
        $updatedResponse = $youtube->videos->update('snippet', $updatedVideo);

        echo "Video updated successfully!\n";
        echo "New Title: " . $updatedResponse['snippet']['title'] . "\n";
    } catch (Google_Service_Exception $e) {
        echo 'A service error occurred: ' . $e->getMessage();
    } catch (Google_Exception $e) {
        echo 'An error occurred: ' . $e->getMessage();
    }
};

function createJsonFile($data, $filePath) {
    // Encode data to JSON
    $jsonData = json_encode($data, JSON_PRETTY_PRINT);

    // Check if encoding was successful
    if ($jsonData === false) {
        echo 'Failed to encode data to JSON.';
        return false;
    }

    // Write JSON to file
    if (file_put_contents($filePath, $jsonData) === false) {
        echo 'Failed to write JSON data to file.';
        return false;
    }

    echo 'JSON file created successfully!';
    return true;
}

$videoId = 'nGvdHESlRwc';
getVideoDetails($videoId);
?>