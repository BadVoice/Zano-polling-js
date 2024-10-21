import { base58Encode } from './base58';
import { getChecksum } from './crypto';

export function addressEncode(tag: number, flag: number, spendKey: Buffer, viewKey: Buffer) {
  let buf: Buffer = Buffer.from([tag, flag]);
  buf = Buffer.concat([buf, spendKey, viewKey]);
  const hash: string = getChecksum(buf);
  return base58Encode(Buffer.concat([buf, Buffer.from(hash, 'hex')]));
}
