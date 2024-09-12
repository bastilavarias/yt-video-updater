const { google } = require('googleapis');
const fs = require('fs');

const updateVideoDetails = async ({ views, videoId, refreshToken }) => {
    const client = new google.auth.OAuth2();
    client.setCredentials(JSON.parse(refreshToken));
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
        console.error('Action:', 'Update video title');
        console.error('Error:', err.message);
        console.error(err);
    }
};

const updateThumbnail = async ({ views, videoId, refreshToken }) => {
    const client = new google.auth.OAuth2();
    client.setCredentials(JSON.parse(refreshToken));
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
        console.error('Action:', 'Update video thumbnail');
        console.error('Error:', err.message);
        console.error(err);
    }
};

const process = async ({ views, videoId, refreshToken }) => {
    await updateVideoDetails({ views, videoId, refreshToken });
    await updateThumbnail({ views, videoId, refreshToken });
};

const service = {
    process,
};

module.exports = service;
