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
        video.snippet.title = `ANG VIDEO NA 'TO AY MAYROONG ${formatNumber(views, 100000)} VIEWS, ${formatNumber(likes, 10000)} LIKES AT ${formatNumber(comments, 10000)} COMMENTS`;
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
        await youtube.thumbnails.set({
            videoId: videoId,
            media: {
                body: fs.createReadStream(
                    path.join(__dirname, 'assets', 'processed-thumbnail.jpg'),
                ),
            },
        });

        console.log('Thumbnail updated successfully!');
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
    const FONT_COLOR = '#f9c001';
    const STROKE_COLOR = 'black';

    const drawTextWithSpacing = (
        context,
        text,
        x,
        y,
        letterSpacing,
        outline = true,
    ) => {
        context.save();
        let currentX = x;
        for (let i = 0; i < text.length; i++) {
            if (outline) {
                context.strokeText(text[i], currentX, y);
            }
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
        const textHeightBase = canvas.height / 2 - 130;

        /*
         * Views Count
         * */
        context.font = '170px MontserratBlack';
        context.fillStyle = FONT_COLOR;
        context.strokeStyle = STROKE_COLOR;
        context.lineWidth = 15;
        context.textAlign = 'left';
        const theViews = formatNumber(views, 100000);
        await drawTextWithSpacing(
            context,
            theViews,
            textWidthBase,
            textHeightBase - 60,
            20,
        );
        context.font = '100px MontserratBlack';
        context.fillStyle = 'white';
        drawTextWithSpacing(
            context,
            'VIEWS NA!',
            textWidthBase,
            textHeightBase + 40,
            2,
            false,
        );

        /*
         * Likes Count
         * */
        context.font = '150px MontserratBlack';
        context.fillStyle = FONT_COLOR;
        context.strokeStyle = STROKE_COLOR;
        context.lineWidth = 15;
        context.textAlign = 'left';
        context.textAlign = 'left';
        await drawTextWithSpacing(
            context,
            formatNumber(likes, 1000),
            textWidthBase,
            textHeightBase + 200,
            10,
        );
        context.font = '60px MontserratBlack';
        context.fillStyle = 'white';
        drawTextWithSpacing(
            context,
            'LIKES',
            textWidthBase,
            textHeightBase + 270,
            2,
            false,
        );

        /*
         * Comments Count
         * */
        context.font = '150px MontserratBlack';
        context.fillStyle = FONT_COLOR;
        context.strokeStyle = STROKE_COLOR;
        context.lineWidth = 15;
        context.textAlign = 'left';
        context.textAlign = 'left';
        await drawTextWithSpacing(
            context,
            formatNumber(comments, 1000),
            textWidthBase * 1.7,
            textHeightBase + 200,
            10,
        );
        context.font = '60px MontserratBlack';
        context.fillStyle = 'white';
        drawTextWithSpacing(
            context,
            'COMMENTS',
            textWidthBase * 1.7,
            textHeightBase + 270,
            2,
            false,
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
    console.log('Updating YouTube video....');
    console.log(
        new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }),
    );
    await updateVideoDetails({ videoId, views, likes, comments, refreshToken });
    await updateThumbnail({ videoId, views, likes, comments, refreshToken });
    console.log('End of updating.');
};

loadFonts();
const service = {
    process,
};

module.exports = service;
