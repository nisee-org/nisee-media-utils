export declare function hkdf(buffer: Uint8Array | Buffer, expandedLength: number, info: {
    salt?: Buffer;
    info?: string;
}): Buffer;
