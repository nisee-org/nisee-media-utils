import { proto } from "../../WAProto";

export const MEDIA_HKDF_KEY_MAPPING = {
  audio: "Audio",
  document: "Document",
  gif: "Video",
  image: "Image",
  ppic: "",
  product: "Image",
  ptt: "Audio",
  sticker: "Image",
  video: "Video",
  "thumbnail-document": "Document Thumbnail",
  "thumbnail-image": "Image Thumbnail",
  "thumbnail-video": "Video Thumbnail",
  "thumbnail-link": "Link Thumbnail",
  "md-msg-hist": "History",
  "md-app-state": "App State",
  "product-catalog-image": "",
  "payment-bg-image": "Payment Background",
  ptv: "Video",
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
