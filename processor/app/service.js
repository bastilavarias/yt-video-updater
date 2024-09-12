const { google } = require('googleapis');
const sharp = require('sharp');
const path = require('path');

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

const updateThumbnail = async ({
    videoId,
    views,
    likes,
    comments,
    refreshToken,
}) => {
    const client = new google.auth.OAuth2();
    client.setCredentials(JSON.parse(refreshToken));
    const youtube = google.youtube({ version: 'v3', auth: client });
    try {
        await createThumbnail({ views, likes, comments });
        // const response = await youtube.thumbnails.set({
        //     videoId: videoId,
        //     media: {
        //         body: fs.createReadStream('./thumbnail.png'),
        //     },
        // });
        //
        // console.log('Thumbnail updated successfully!');
        // console.log('Response:', response.data);
    } catch (err) {
        console.error('Action:', 'Update video thumbnail');
        console.error('Error:', err.message);
        console.error(err);
    }
};

const createThumbnail = async ({ views, likes, comments }) => {
    try {
        const width = 1280;
        const height = 720;
        const text = 'E.T, go home';
        const svgText = `
    <svg width="${width}" height="${height}">
      <style>
      .title { fill: #ffffff; font-size: 70px; font-weight: bold;}
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="title">${text}</text>
    </svg>
    `;

        const svgBuffer = Buffer.from(svgText);

        await sharp(path.join(__dirname, 'assets', 'original-thumbnail.jpg'))
            .composite([{ input: svgBuffer, left: 5, top: 5 }])
            .toFile(path.join(__dirname, 'assets', 'processed-thumbnail.jpg'));

        console.log('Thumbnail picture created successfully!');
    } catch (err) {
        console.error('Action:', 'Create thumbnail picture');
        console.error('Error:', err.message);
        console.error(err);
    }
};

const process = async ({ views, videoId, likes, comments, refreshToken }) => {
    // await updateVideoDetails({ videoId, views, refreshToken });
    await updateThumbnail({ videoId, views, likes, comments, refreshToken });
};

const service = {
    process,
};

module.exports = service;
