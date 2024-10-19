import { cnFastHash } from './keccak';
const ADDRESS_CHECKSUM_SIZE = 4;

export function getChecksum(buffer): Uint8Array {
  return cnFastHash(buffer).subarray(0, ADDRESS_CHECKSUM_SIZE);
}
