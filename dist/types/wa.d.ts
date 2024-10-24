import { proto } from "../../WAProto";
export declare const MEDIA_HKDF_KEY_MAPPING: {
    audio: string;
    document: string;
    gif: string;
    image: string;
    ppic: string;
    product: string;
    ptt: string;
    sticker: string;
    video: string;
    "thumbnail-document": string;
    "thumbnail-image": string;
    "thumbnail-video": string;
    "thumbnail-link": string;
    "md-msg-hist": string;
    "md-app-state": string;
    "product-catalog-image": string;
    "payment-bg-image": string;
    ptv: string;
};
export type WAMessage = proto.IWebMessageInfo;
export type WAMessageContent = proto.IMessage;
export type MediaType = keyof typeof MEDIA_HKDF_KEY_MAPPING;
export type DownloadableMessage = {
    mediaKey?: Uint8Array | null;
    directPath?: string | null;
    url?: string | null;
};
export type MediaDecryptionKeyInfo = {
    iv: Buffer;
    cipherKey: Buffer;
    macKey?: Buffer;
};
