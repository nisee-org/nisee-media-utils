import { Boom } from "@hapi/boom";
import { AxiosRequestConfig } from "axios";
import { Transform } from "stream";
import { downloadContentFromMessage } from "./messages-media";
import { proto } from "./types/WAProto";
import {
  DownloadableMessage,
  MediaType,
  WAMessage,
  WAMessageContent,
} from "./types/wa";
export type MediaDownloadOptions = {
  startByte?: number;
  endByte?: number;
  options?: AxiosRequestConfig<{}>;
};

export const downloadMediaMessage = async <Type extends "buffer" | "stream">(
  message: WAMessage,
  type: Type,
  options: MediaDownloadOptions
) => {
  const result = await downloadMsg().catch(async (error) => {
    throw error;
  });

  return result as Type extends "buffer" ? Buffer : Transform;

  async function downloadMsg() {
    const mContent = extractMessageContent(message.message);
    if (!mContent) {
      throw new Boom("No message present", { statusCode: 400, data: message });
    }

    const contentType = getContentType(mContent);
    let mediaType = contentType?.replace("Message", "") as MediaType;
    const media = mContent[contentType!];

    if (
      !media ||
      typeof media !== "object" ||
      (!("url" in media) && !("thumbnailDirectPath" in media))
    ) {
      throw new Boom(`"${contentType}" message is not a media message`);
    }

    let download: DownloadableMessage;
    if ("thumbnailDirectPath" in media && !("url" in media)) {
      download = {
        directPath: media.thumbnailDirectPath,
        mediaKey: media.mediaKey,
      };
      mediaType = "thumbnail-link";
    } else {
      download = media;
    }

    const stream = await downloadContentFromMessage(
      download,
      mediaType,
      options
    );
    if (type === "buffer") {
      const bufferArray: Buffer[] = [];
      for await (const chunk of stream) {
        bufferArray.push(chunk);
      }

      return Buffer.concat(bufferArray);
    }

    return stream;
  }
};

/** Get the key to access the true type of content */
export const getContentType = (content: proto.IMessage | undefined) => {
  if (content) {
    const keys = Object.keys(content);
    const key = keys.find(
      (k) =>
        (k === "conversation" || k.includes("Message")) &&
        k !== "senderKeyDistributionMessage"
    );
    return key as keyof typeof content;
  }
};

export const normalizeMessageContent = (
  content: WAMessageContent | null | undefined
): WAMessageContent | undefined => {
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

  return content!;

  function getFutureProofMessage(message: typeof content) {
    return (
      message?.ephemeralMessage ||
      message?.viewOnceMessage ||
      message?.documentWithCaptionMessage ||
      message?.viewOnceMessageV2 ||
      message?.viewOnceMessageV2Extension ||
      message?.editedMessage
    );
  }
};

export const extractMessageContent = (
  content: WAMessageContent | undefined | null
): WAMessageContent | undefined => {
  const extractFromTemplateMessage = (
    msg:
      | proto.Message.TemplateMessage.IHydratedFourRowTemplate
      | proto.Message.IButtonsMessage
  ) => {
    if (msg.imageMessage) {
      return { imageMessage: msg.imageMessage };
    } else if (msg.documentMessage) {
      return { documentMessage: msg.documentMessage };
    } else if (msg.videoMessage) {
      return { videoMessage: msg.videoMessage };
    } else if (msg.locationMessage) {
      return { locationMessage: msg.locationMessage };
    } else {
      return {
        conversation:
          "contentText" in msg
            ? msg.contentText
            : "hydratedContentText" in msg
            ? msg.hydratedContentText
            : "",
      };
    }
  };

  content = normalizeMessageContent(content);

  if (content?.buttonsMessage) {
    return extractFromTemplateMessage(content.buttonsMessage);
  }

  if (content?.templateMessage?.hydratedFourRowTemplate) {
    return extractFromTemplateMessage(
      content?.templateMessage?.hydratedFourRowTemplate
    );
  }

  if (content?.templateMessage?.hydratedTemplate) {
    return extractFromTemplateMessage(
      content?.templateMessage?.hydratedTemplate
    );
  }

  if (content?.templateMessage?.fourRowTemplate) {
    return extractFromTemplateMessage(
      content?.templateMessage?.fourRowTemplate
    );
  }

  return content;
};
