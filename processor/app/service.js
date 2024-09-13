const { google } = require('googleapis');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const { createWriteStream } = require('fs');

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
        const image = await loadImage(
            path.join(__dirname, 'assets', 'original-thumbnail.jpg'),
        );
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        ctx.font = '100px MontserratBlack';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(views, canvas.width / 2, canvas.height / 2);

        const out = createWriteStream(
            path.join(__dirname, 'assets', 'processed-thumbnail.jpg'),
        );
        const stream = canvas.createJPEGStream();
        stream.pipe(out);

        // Wait for the file to finish saving
        await new Promise((resolve, reject) => {
            out.on('finish', resolve);
            out.on('error', reject);
        });

        console.log('Thumbnail picture created successfully!');
    } catch (err) {
        console.error('Action:', 'Create thumbnail picture');
        console.error('Error:', err.message);
        console.error(err);
    }
};
const loadFonts = () => {
    registerFont(
        path.join(__dirname, 'assets', 'montserrat/MontserratRegular.ttf'),
        {
            family: 'Montserrat',
        },
    );
    registerFont(
        path.join(__dirname, 'assets', 'montserrat/MontserratBlack.ttf'),
        {
            family: 'MontserratBlack',
        },
    );
};

const process = async ({ views, videoId, likes, comments, refreshToken }) => {
    // await updateVideoDetails({ videoId, views, refreshToken });
    await updateThumbnail({ videoId, views, likes, comments, refreshToken });
};

loadFonts();
const service = {
    process,
};

module.exports = service;
