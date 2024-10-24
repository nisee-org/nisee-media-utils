import HKDF from "futoin-hkdf";

export function hkdf(
  buffer: Uint8Array | Buffer,
  expandedLength: number,
  info: { salt?: Buffer; info?: string }
) {
  return HKDF(
    !Buffer.isBuffer(buffer) ? Buffer.from(buffer) : buffer,
    expandedLength,
    info
  );
}
