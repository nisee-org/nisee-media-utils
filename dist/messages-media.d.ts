import { AxiosRequestConfig } from "axios";
import { Readable, Transform } from "stream";
import { MediaDownloadOptions } from "./messages";
import { DownloadableMessage, MediaDecryptionKeyInfo, MediaType } from "./types/wa";
export declare const DEFAULT_ORIGIN = "https://web.whatsapp.com";
export declare const getUrlFromDirectPath: (directPath: string) => string;
export declare const getHttpStream: (url: string | URL, options?: AxiosRequestConfig & {
    isStream?: true;
}) => Promise<Readable>;
export declare const hkdfInfoKey: (type: MediaType) => string;
export declare function getMediaKeys(buffer: Uint8Array | string | null | undefined, mediaType: MediaType): MediaDecryptionKeyInfo;
export declare const downloadContentFromMessage: ({ mediaKey, directPath, url }: DownloadableMessage, type: MediaType, opts?: MediaDownloadOptions) => Promise<Transform>;
export declare const downloadEncryptedContent: (downloadUrl: string, { cipherKey, iv }: MediaDecryptionKeyInfo, { startByte, endByte, options }?: MediaDownloadOptions) => Promise<Transform>;
