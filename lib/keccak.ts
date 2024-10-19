const KECCAK_ROUNDS = 24;
const HASH_SIZE = 32;
const HASH_DATA_AREA: number = 200 - 2 * HASH_SIZE;

const keccakfRndc: bigint[] = [
  BigInt(0x0000000000000001),
  BigInt(0x0000000000008082),
  BigInt(0x800000000000808a),
  BigInt(0x8000000080008000),
  BigInt(0x000000000000808b),
  BigInt(0x0000000080000001),
  BigInt(0x8000000080008081),
  BigInt(0x8000000000008009),
  BigInt(0x000000000000008a),
  BigInt(0x0000000000000088),
  BigInt(0x0000000080008009),
  BigInt(0x000000008000000a),
  BigInt(0x000000008000808b),
  BigInt(0x800000000000008b),
  BigInt(0x8000000000008089),
  BigInt(0x8000000000008003),
  BigInt(0x8000000000008002),
  BigInt(0x8000000000000080),
  BigInt(0x000000000000800a),
  BigInt(0x800000008000000a),
  BigInt(0x8000000080008081),
  BigInt(0x8000000000008080),
  BigInt(0x0000000080000001),
  BigInt(0x8000000080008008),
];

const keccakfRotc: number[] = [
  1,  3,  6,  10, 15, 21, 28, 36, 45, 55, 2,  14,
  27, 41, 56, 8,  25, 43, 62, 18, 39, 61, 20, 44,
];

const keccakfPiln: number[] = [
  10, 7,  11, 17, 18, 3, 5,  16, 8,  21, 24, 4,
  15, 23, 19, 13, 12, 2, 20, 14, 22, 9,  6,  1,
];

function rotl64(value: bigint, shift: number): bigint {
  return (value << BigInt(shift)) | (value >> BigInt(64 - shift));
}

function keccakf(st: bigint[], rounds: number): void {
  let t: bigint;
  const bc: bigint[] = new Array(5).fill(BigInt(0));

  for (let round = 0; round < rounds; round++) {
    // Theta
    for (let i = 0; i < 5; i++) {
      bc[i] = st[i] ^ st[i + 5] ^ st[i + 10] ^ st[i + 15] ^ st[i + 20];
    }

    for (let i = 0; i < 5; i++) {
      t = bc[(i + 4) % 5] ^ rotl64(bc[(i + 1) % 5], 1);
      for (let j = 0; j < 25; j += 5) {
        st[j + i] ^= t;
      }
    }

    // Rho и Pi
    t = st[1];
    for (let i = 0; i < 24; i++) {
      const j = keccakfPiln[i];
      const temp = st[j];
      st[j] = rotl64(t, keccakfRotc[i]);
      t = temp;
    }

    // Chi
    for (let j = 0; j < 25; j += 5) {
      for (let i = 0; i < 5; i++) {
        bc[i] = st[j + i];
      }
      for (let i = 0; i < 5; i++) {
        st[j + i] ^= (~bc[(i + 1) % 5] & bc[(i + 2) % 5]);
      }
    }

    // Iota
    st[0] ^= keccakfRndc[round];
  }
}

function keccak(inData: Uint8Array, inlen: number, mdlen: number): Uint8Array {
  const st: bigint[] = new Array(25).fill(BigInt(0));
  const temp: Uint8Array = new Uint8Array(144);
  const rsiz = mdlen === HASH_SIZE ? HASH_DATA_AREA : 200 - 2 * mdlen;
  const rsizw = rsiz / 8;

  let offset = 0;

  while (inlen >= rsiz) {
    for (let i = 0; i < rsizw; i++) {
      st[i] ^= new DataView(inData.buffer).getBigUint64(offset + i * 8, true);
    }
    keccakf(st, KECCAK_ROUNDS);
    inlen -= rsiz;
    offset += rsiz;
  }

  temp.set(inData.slice(offset, offset + inlen));
  temp[inlen] = 1;
  for (let i = inlen + 1; i < rsiz; i++) {
    temp[i] = 0;
  }
  temp[rsiz - 1] |= 0x80;

  for (let i = 0; i < rsizw; i++) {
    st[i] ^= new DataView(temp.buffer).getBigUint64(i * 8, true);
  }

  keccakf(st, KECCAK_ROUNDS);

  const result = new Uint8Array(mdlen);
  for (let i = 0; i < mdlen / 8; i++) {
    const hash = st[i];
    const dv = new DataView(result.buffer);
    dv.setBigUint64(i * 8, hash, true);
  }

  return result;
}

export function cnFastHash(data: Uint8Array): Uint8Array {
  return keccak(data, data.length, HASH_SIZE);
}
