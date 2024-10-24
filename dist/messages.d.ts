import { AxiosRequestConfig } from "axios";
import { Transform } from "stream";
import { proto } from "../WAProto";
import { WAMessage, WAMessageContent } from "./types/wa";
export type MediaDownloadOptions = {
    startByte?: number;
    endByte?: number;
    options?: AxiosRequestConfig<{}>;
};
export declare const downloadMediaMessage: <Type extends "buffer" | "stream">(message: WAMessage, type: Type, options: MediaDownloadOptions) => Promise<Type extends "buffer" ? Buffer : Transform>;
/** Get the key to access the true type of content */
export declare const getContentType: (content: proto.IMessage | undefined) => keyof proto.IMessage | undefined;
export declare const normalizeMessageContent: (content: WAMessageContent | null | undefined) => WAMessageContent | undefined;
export declare const extractMessageContent: (content: WAMessageContent | undefined | null) => WAMessageContent | undefined;
