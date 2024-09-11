const { google } = require('googleapis');
const fs = require('fs');

const updateVideoDetails = async ({ views, videoId, clientSecret }) => {
    const client = new google.auth.OAuth2();
    client.setCredentials(JSON.parse(clientSecret));
    const youtube = google.youtube({ version: 'v3', auth: client });
    try {
        const response = await youtube.videos.list({
            part: 'snippet',
            id: videoId,
        });
        if (!response.data.items.length) {
            console.log(`No video found with ID: ${videoId}`);
            return;
        }
        const video = response.data.items[0];
        video.snippet.title = `₱20 Pesos Bakal GYM in TONDO ${views}`;
        const updatedResponse = await youtube.videos.update({
            part: 'snippet',
            requestBody: {
                id: videoId,
                snippet: video.snippet,
            },
        });

        console.log('Video updated successfully!');
        console.log('New Title:', updatedResponse.data.snippet.title);
    } catch (err) {
        console.error('Error:', err.message);
    }
};

const updateThumbnail = async ({ views, videoId, clientSecret }) => {
    const client = new google.auth.OAuth2();
    client.setCredentials(JSON.parse(clientSecret));
    const youtube = google.youtube({ version: 'v3', auth: client });
    try {
        const response = await youtube.thumbnails.set({
            videoId: videoId,
            media: {
                body: fs.createReadStream('./thumbnail.png'),
            },
        });

        console.log('Thumbnail updated successfully!');
        console.log('Response:', response.data);
    } catch (err) {
        console.error('Error:', err.message);
    }
};

const process = async ({ views, videoId, clientSecret }) => {
    await updateVideoDetails({ views, videoId, clientSecret });
    await updateThumbnail({ views, videoId, clientSecret });
};

const service = {
    process,
};

module.exports = service;
