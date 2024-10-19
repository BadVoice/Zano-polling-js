import { cnFastHash } from './keccak';

export function getChecksum(buffer): Uint8Array {
  return cnFastHash(buffer).subarray(0, 4);
}
