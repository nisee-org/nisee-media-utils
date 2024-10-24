"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMessageContent = exports.normalizeMessageContent = exports.getContentType = exports.downloadMediaMessage = void 0;
const boom_1 = require("@hapi/boom");
const messages_media_1 = require("./messages-media");
const downloadMediaMessage = async (message, type, options) => {
    const result = await downloadMsg().catch(async (error) => {
        throw error;
    });
    return result;
    async function downloadMsg() {
        const mContent = (0, exports.extractMessageContent)(message.message);
        if (!mContent) {
            throw new boom_1.Boom("No message present", { statusCode: 400, data: message });
        }
        const contentType = (0, exports.getContentType)(mContent);
        let mediaType = contentType === null || contentType === void 0 ? void 0 : contentType.replace("Message", "");
        const media = mContent[contentType];
        if (!media ||
            typeof media !== "object" ||
            (!("url" in media) && !("thumbnailDirectPath" in media))) {
            throw new boom_1.Boom(`"${contentType}" message is not a media message`);
        }
        let download;
        if ("thumbnailDirectPath" in media && !("url" in media)) {
            download = {
                directPath: media.thumbnailDirectPath,
                mediaKey: media.mediaKey,
            };
            mediaType = "thumbnail-link";
        }
        else {
            download = media;
        }
        const stream = await (0, messages_media_1.downloadContentFromMessage)(download, mediaType, options);
        if (type === "buffer") {
            const bufferArray = [];
            for await (const chunk of stream) {
                bufferArray.push(chunk);
            }
            return Buffer.concat(bufferArray);
        }
        return stream;
    }
};
exports.downloadMediaMessage = downloadMediaMessage;
/** Get the key to access the true type of content */
const getContentType = (content) => {
    if (content) {
        const keys = Object.keys(content);
        const key = keys.find((k) => (k === "conversation" || k.includes("Message")) &&
            k !== "senderKeyDistributionMessage");
        return key;
    }
};
exports.getContentType = getContentType;
const normalizeMessageContent = (content) => {
    if (!content) {
        return undefined;
    }
    // set max iterations to prevent an infinite loop
    for (let i = 0; i < 5; i++) {
        const inner = getFutureProofMessage(content);
        if (!inner) {
            break;
        }
        content = inner.message;
    }
    return content;
    function getFutureProofMessage(message) {
        return ((message === null || message === void 0 ? void 0 : message.ephemeralMessage) ||
            (message === null || message === void 0 ? void 0 : message.viewOnceMessage) ||
            (message === null || message === void 0 ? void 0 : message.documentWithCaptionMessage) ||
            (message === null || message === void 0 ? void 0 : message.viewOnceMessageV2) ||
            (message === null || message === void 0 ? void 0 : message.viewOnceMessageV2Extension) ||
            (message === null || message === void 0 ? void 0 : message.editedMessage));
    }
};
exports.normalizeMessageContent = normalizeMessageContent;
const extractMessageContent = (content) => {
    var _a, _b, _c, _d, _e, _f;
    const extractFromTemplateMessage = (msg) => {
        if (msg.imageMessage) {
            return { imageMessage: msg.imageMessage };
        }
        else if (msg.documentMessage) {
            return { documentMessage: msg.documentMessage };
        }
        else if (msg.videoMessage) {
            return { videoMessage: msg.videoMessage };
        }
        else if (msg.locationMessage) {
            return { locationMessage: msg.locationMessage };
        }
        else {
            return {
                conversation: "contentText" in msg
                    ? msg.contentText
                    : "hydratedContentText" in msg
                        ? msg.hydratedContentText
                        : "",
            };
        }
    };
    content = (0, exports.normalizeMessageContent)(content);
    if (content === null || content === void 0 ? void 0 : content.buttonsMessage) {
        return extractFromTemplateMessage(content.buttonsMessage);
    }
    if ((_a = content === null || content === void 0 ? void 0 : content.templateMessage) === null || _a === void 0 ? void 0 : _a.hydratedFourRowTemplate) {
        return extractFromTemplateMessage((_b = content === null || content === void 0 ? void 0 : content.templateMessage) === null || _b === void 0 ? void 0 : _b.hydratedFourRowTemplate);
    }
    if ((_c = content === null || content === void 0 ? void 0 : content.templateMessage) === null || _c === void 0 ? void 0 : _c.hydratedTemplate) {
        return extractFromTemplateMessage((_d = content === null || content === void 0 ? void 0 : content.templateMessage) === null || _d === void 0 ? void 0 : _d.hydratedTemplate);
    }
    if ((_e = content === null || content === void 0 ? void 0 : content.templateMessage) === null || _e === void 0 ? void 0 : _e.fourRowTemplate) {
        return extractFromTemplateMessage((_f = content === null || content === void 0 ? void 0 : content.templateMessage) === null || _f === void 0 ? void 0 : _f.fourRowTemplate);
    }
    return content;
};
exports.extractMessageContent = extractMessageContent;
