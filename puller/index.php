<?php

$videoID = 'nGvdHESlRwc';
$apiKey = 'AIzaSyDPw6sIn7qjLn3SFf-SwjCUVUrK4e47sjk'; // Development key

// Get video details
/*$ch = curl_init("https://www.googleapis.com/youtube/v3/videos?id=$videoID&key=$apiKey&part=contentDetails,statistics,status");
echo curl_exec($ch);
curl_close($ch);
*/


/**
 * Sample PHP code for youtube.videos.update
 * See instructions for running these code samples locally:
 * https://developers.google.com/explorer-help/code-samples#php
 */

if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    throw new Exception(sprintf('Please run "composer require google/apiclient:~2.0" in "%s"', __DIR__));
}
require_once __DIR__ . '/vendor/autoload.php';

$client = new Google_Client();
$client->setApplicationName('API code samples');
$client->setScopes([
    'https://www.googleapis.com/auth/youtube.force-ssl',
]);

// TODO: For this request to work, you must replace
//       "YOUR_CLIENT_SECRET_FILE.json" with a pointer to your
//       client_secret.json file. For more information, see
//       https://cloud.google.com/iam/docs/creating-managing-service-account-keys
$client->setAuthConfig('YOUR_CLIENT_SECRET_FILE.json');
$client->setAccessType('offline');

// Request authorization from the user.
$authUrl = $client->createAuthUrl();
printf("Open this link in your browser:\n%s\n", $authUrl);
print('Enter verification code: ');
$authCode = trim(fgets(STDIN));

// Exchange authorization code for an access token.
$accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
$client->setAccessToken($accessToken);

// Define service object for making API requests.
$service = new Google_Service_YouTube($client);

// Define the $video object, which will be uploaded as the request body.
$video = new Google_Service_YouTube_Video();

// Add 'id' string to the $video object.
$video->setId('');

$response = $service->videos->update('', $video);
print_r($response);
?>