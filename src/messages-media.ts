import { Boom } from "@hapi/boom";
import axios, { AxiosRequestConfig } from "axios";
import * as Crypto from "crypto";
import { Readable, Transform } from "stream";
import { hkdf } from "./crypto";
import { MediaDownloadOptions } from "./messages";
import {
  DownloadableMessage,
  MEDIA_HKDF_KEY_MAPPING,
  MediaDecryptionKeyInfo,
  MediaType,
} from "./types/wa";

const DEF_HOST = "mmg.whatsapp.net";
const AES_CHUNK_SIZE = 16;
export const DEFAULT_ORIGIN = "https://web.whatsapp.com";

const toSmallestChunkSize = (num: number) => {
  return Math.floor(num / AES_CHUNK_SIZE) * AES_CHUNK_SIZE;
};

export const getUrlFromDirectPath = (directPath: string) =>
  `https://${DEF_HOST}${directPath}`;

export const getHttpStream = async (
  url: string | URL,
  options: AxiosRequestConfig & { isStream?: true } = {}
) => {
  const fetched = await axios.get(url.toString(), {
    ...options,
    responseType: "stream",
  });
  return fetched.data as Readable;
};

export const hkdfInfoKey = (type: MediaType) => {
  const hkdfInfo = MEDIA_HKDF_KEY_MAPPING[type];
  return `WhatsApp ${hkdfInfo} Keys`;
};

export function getMediaKeys(
  buffer: Uint8Array | string | null | undefined,
  mediaType: MediaType
): MediaDecryptionKeyInfo {
  if (!buffer) {
    throw new Boom("Cannot derive from empty media key");
  }

  if (typeof buffer === "string") {
    buffer = Buffer.from(buffer.replace("data:;base64,", ""), "base64");
  }

  // expand using HKDF to 112 bytes, also pass in the relevant app info
  const expandedMediaKey = hkdf(buffer, 112, { info: hkdfInfoKey(mediaType) });
  return {
    iv: expandedMediaKey.slice(0, 16),
    cipherKey: expandedMediaKey.slice(16, 48),
    macKey: expandedMediaKey.slice(48, 80),
  };
}

export const downloadContentFromMessage = (
  { mediaKey, directPath, url }: DownloadableMessage,
  type: MediaType,
  opts: MediaDownloadOptions = {}
) => {
  const downloadUrl = url || getUrlFromDirectPath(directPath!);
  const keys = getMediaKeys(mediaKey, type);

  return downloadEncryptedContent(downloadUrl, keys, opts);
};

export const downloadEncryptedContent = async (
  downloadUrl: string,
  { cipherKey, iv }: MediaDecryptionKeyInfo,
  { startByte, endByte, options }: MediaDownloadOptions = {}
) => {
  let bytesFetched = 0;
  let startChunk = 0;
  let firstBlockIsIV = false;
  // if a start byte is specified -- then we need to fetch the previous chunk as that will form the IV
  if (startByte) {
    const chunk = toSmallestChunkSize(startByte || 0);
    if (chunk) {
      startChunk = chunk - AES_CHUNK_SIZE;
      bytesFetched = chunk;

      firstBlockIsIV = true;
    }
  }

  const endChunk = endByte
    ? toSmallestChunkSize(endByte || 0) + AES_CHUNK_SIZE
    : undefined;

  const headers: AxiosRequestConfig["headers"] = {
    ...(options?.headers || {}),
    Origin: DEFAULT_ORIGIN,
  };
  if (startChunk || endChunk) {
    headers.Range = `bytes=${startChunk}-`;
    if (endChunk) {
      headers.Range += endChunk;
    }
  }

  // download the message
  const fetched = await getHttpStream(downloadUrl, {
    ...(options || {}),
    headers,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  let remainingBytes = Buffer.from([]);

  let aes: Crypto.Decipher;

  const pushBytes = (bytes: Buffer, push: (bytes: Buffer) => void) => {
    if (startByte || endByte) {
      const start =
        bytesFetched >= startByte!
          ? undefined
          : Math.max(startByte! - bytesFetched, 0);
      const end =
        bytesFetched + bytes.length < endByte!
          ? undefined
          : Math.max(endByte! - bytesFetched, 0);

      push(bytes.slice(start, end));

      bytesFetched += bytes.length;
    } else {
      push(bytes);
    }
  };

  const output = new Transform({
    transform(chunk, _, callback) {
      let data = Buffer.concat([remainingBytes, chunk]);

      const decryptLength = toSmallestChunkSize(data.length);
      remainingBytes = data.slice(decryptLength);
      data = data.slice(0, decryptLength);

      if (!aes) {
        let ivValue = iv;
        if (firstBlockIsIV) {
          ivValue = data.slice(0, AES_CHUNK_SIZE);
          data = data.slice(AES_CHUNK_SIZE);
        }

        aes = Crypto.createDecipheriv("aes-256-cbc", cipherKey, ivValue);
        // if an end byte that is not EOF is specified
        // stop auto padding (PKCS7) -- otherwise throws an error for decryption
        if (endByte) {
          aes.setAutoPadding(false);
        }
      }

      try {
        pushBytes(aes.update(data), (b) => this.push(b));
        callback();
      } catch (error) {
        callback(error);
      }
    },
    final(callback) {
      try {
        pushBytes(aes.final(), (b) => this.push(b));
        callback();
      } catch (error) {
        callback(error);
      }
    },
  });
  return fetched.pipe(output, { end: true });
};
