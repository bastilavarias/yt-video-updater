const { google } = require('googleapis');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const { createWriteStream } = require('fs');
const fs = require('fs');

/**
 * @description Formats a number into a human-readable string, adding 'k' for thousands or 'M' for millions
 * based on the provided limit. For smaller numbers, it returns the number with comma separators.
 *
 * @param {number} number - The number to be formatted.
 * @param {number} limit - The threshold to determine if 'k' or 'M' should be added.
 * @returns {string} - The formatted number.
 */
function formatNumber(number, limit) {
    if (number >= limit) {
        const divisor = limit >= 1_000_000 ? 1_000_000 : 1_000;
        const suffix = limit >= 1_000_000 ? 'M' : 'k';

        return (number / divisor).toFixed(1).replace(/\.0$/, '') + suffix;
    } else {
        return number.toLocaleString();
    }
}

/**
 * @description Updates the YouTube video title by fetching the video data, modifying its title to include
 * views, likes, and comments, and then updating the video on YouTube using the YouTube Data API.
 *
 * @param {object} videoDetails - Object containing videoId, views, likes, comments, and refreshToken.
 * @returns {Promise<void>} - Updates the video title asynchronously.
 */
const updateVideoDetails = async ({
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
        const response = await youtube.videos.list({
            part: 'snippet',
            id: videoId,
        });
        if (!response.data.items.length) {
            console.log(`No video found with ID: ${videoId}`);
            return;
        }
        const video = response.data.items[0];
        video.snippet.title = `ANG VIDEO NA 'TO AY MERONG ${formatNumber(views, 100000)} VIEWS, ${formatNumber(likes, 10000)} LIKES AT ${formatNumber(views, 10000)} COMMENTS`;
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

/**
 * @description Updates the YouTube video thumbnail by creating a new thumbnail image
 * and uploading it using the YouTube Data API.
 *
 * @param {object} videoDetails - Object containing videoId, views, likes, comments, and refreshToken.
 * @returns {Promise<void>} - Updates the video thumbnail asynchronously.
 */
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
        const response = await youtube.thumbnails.set({
            videoId: videoId,
            media: {
                body: fs.createReadStream(
                    path.join(__dirname, 'assets', 'processed-thumbnail.jpg'),
                ),
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

/**
 * @description Creates a YouTube thumbnail image with dynamic text displaying views, likes, and comments.
 * It uses the canvas library to draw the image and text, and then saves it as a JPEG file.
 *
 * @param {object} details - Object containing views, likes, and comments.
 * @returns {Promise<void>} - Creates and saves the thumbnail image asynchronously.
 */
const createThumbnail = async ({ views, likes, comments }) => {
    const GREEN_COLOR = '#00fb0b';

    const drawTextWithSpacing = (context, text, x, y, letterSpacing) => {
        context.save();
        let currentX = x;
        for (let i = 0; i < text.length; i++) {
            context.fillText(text[i], currentX, y);
            currentX += context.measureText(text[i]).width + letterSpacing;
        }
        context.restore();
    };

    try {
        const image = await loadImage(
            path.join(__dirname, 'assets', `original-thumbnail.jpg`),
        );
        const canvas = createCanvas(image.width, image.height);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);

        const textWidthBase = image.width * 0.4;
        const textLengthBase = canvas.height / 2 - 50;

        /*
         * Views Count
         * */
        context.font = '135px MontserratBlack';
        context.fillStyle = GREEN_COLOR;
        context.textAlign = 'left';
        await drawTextWithSpacing(
            context,
            formatNumber(views, 10000000),
            textWidthBase,
            textLengthBase - 100,
            5,
        );
        context.font = '80px MontserratBlack';
        context.fillStyle = 'white';
        drawTextWithSpacing(
            context,
            'VIEWS NA!!',
            textWidthBase,
            textLengthBase,
            2,
        );

        /*
         * Likes Count
         * */
        context.font = '100px MontserratBlack';
        context.fillStyle = GREEN_COLOR;
        context.textAlign = 'left';
        await drawTextWithSpacing(
            context,
            formatNumber(likes, 10000),
            textWidthBase,
            textLengthBase + 200,
            5,
        );
        context.font = '40px MontserratBlack';
        context.fillStyle = 'white';
        drawTextWithSpacing(
            context,
            'LIKES',
            textWidthBase,
            textLengthBase + 250,
            2,
        );

        /*
         * Comments Count
         * */
        context.font = '100px MontserratBlack';
        context.fillStyle = GREEN_COLOR;
        context.textAlign = 'left';
        await drawTextWithSpacing(
            context,
            formatNumber(comments, 10000),
            textWidthBase * 1.85,
            textLengthBase + 200,
            5,
        );
        context.font = '40px MontserratBlack';
        context.fillStyle = 'white';
        drawTextWithSpacing(
            context,
            'COMMENTS',
            textWidthBase * 1.85,
            textLengthBase + 250,
            2,
        );

        const out = createWriteStream(
            path.join(__dirname, 'assets', 'processed-thumbnail.jpg'),
        );
        const stream = canvas.createJPEGStream();
        stream.pipe(out);

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

/**
 * @description Loads the required fonts for creating the thumbnail image by registering them with the canvas library.
 */
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

/**
 * @description Orchestrates the process of updating both the video title and thumbnail for a YouTube video.
 * It calls the `updateVideoDetails` and `updateThumbnail` functions sequentially.
 *
 * @param {object} details - Object containing views, videoId, likes, comments, and refreshToken.
 * @returns {Promise<void>} - Executes the update process asynchronously.
 */
const process = async ({ views, videoId, likes, comments, refreshToken }) => {
    await updateVideoDetails({ videoId, views, likes, comments, refreshToken });
    await updateThumbnail({ videoId, views, likes, comments, refreshToken });
};

loadFonts();
const service = {
    process,
};

module.exports = service;
