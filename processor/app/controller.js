const service = require('./service');

const process = async (request, response) => {
    try {
        const payload = {
            videoId: request.body.video_id,
            views: request.body.views,
            clientSecret: request.headers['google-client-secret'],
        };
        const result = await service.process(payload);
        response.formatter.ok(result);
    } catch (error) {
        response.formatter.badRequest(error.message);
    }
};

module.exports = { process };
