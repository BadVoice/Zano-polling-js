import { base58Encode } from './base58';
import { getChecksum } from './crypto';

export function addressEncode(tag: number, data: Buffer) {
  const hash: Uint8Array = getChecksum(data);
  return base58Encode(Buffer.concat([data, Buffer.from(hash)]));
}
