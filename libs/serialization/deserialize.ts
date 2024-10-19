import sodium from 'sodium-native';

import { BinaryArchive } from './binary-archive';
import { TRANSACTION_VERSION_PRE_HF4 } from '../../src/utils/constants';

export class Deserializer {
  private readonly _archive: BinaryArchive;

  constructor(blobString: string) {
    this._archive = new BinaryArchive(Buffer.from(blobString));
  }

  private deserializeObjectBegin(): Record<string, unknown> {
    return {};
  }

  private deserializeObjectEnd(): Record<string, unknown> {
    return {};
  }

  private deserializeArrayEnd(): Record<string, unknown> {
    return {};
  }

  private deserializeVariantEnd(): Record<string, unknown> {
    return {};
  }

  /**
   * Empty function for interface compatibility.
   * Binary format does not use array delimiters.
   * @see https://github.com/hyle-team/zano/blob/69a5d42d9908b7168247e103b2b40aae8c1fb3f5/src/serialization/binary_archive.h#L104
   */
  private delimitArray() {
    return {};
  }

  /**
   * Empty function for interface compatibility.
   * @see https://github.com/hyle-team/zano/blob/69a5d42d9908b7168247e103b2b40aae8c1fb3f5/src/serialization/binary_archive.h#L105
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private endArray() {
    return {};
  }

  get format(): string {
    return 'binary';
  }

  private eof(): boolean {
    return this._archive.eof();
  }

  private readUint8(): number {
    return this._archive.readUint8();
  }

  private readUint16(): bigint {
    return this._archive.readUint16();
  }

  private readUint32(): bigint {
    return this._archive.readUint32();
  }

  private readUint64(): bigint {
    const count = 8;

    const uint64 = this._archive.readBlob(count);

    if (uint64.length !== count) {
      throw new Error(
        `expected to read ${count} bytes of an uint64, but only ${uint64.length}`,
      );
    }

    return uint64.readBigUint64LE();
  }

  private readVarint(): bigint {
    return this._archive.readVarint();
  }

  private getVarintPackedSize(v: number) {
    if (v <= 127) {
      return 1;
    } else if (v <= 16383) {
      return 2;
    } else if (v <= 2097151) {
      return 3;
    } else if (v <= 268435455) {
      return 4;
    } else if (v <= 34359738367) {
      return 5;
    } else if (v <= 4398046511103) {
      return 6;
    } else if (v <= 562949953421311) {
      return 7;
    } else {
      return 8;
    }
  }

  private readString(): string {
    return this._archive.readString();
  }

  private readBlob(size: number): Uint8Array {
    return this._archive.readBlob(size);
  }

  private deserializeBlob(tag: unknown, size: number): Uint8Array {
    return this._archive.readBlob(size);
  }

  /**
   *
   * @see https://github.com/hyle-team/zano/blob/69a5d42d9908b7168247e103b2b40aae8c1fb3f5/src/serialization/binary_archive.h#L98
   */
  private deserializeArrayBegin(varsize = false): unknown[] {
    if (varsize) {
      const size: bigint = this.readVarint();

      if (size > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(
          `arrays of length ${Number.MAX_SAFE_INTEGER} and more are not used`,
        );
      }

      return Array(Number(size));
    }

    return [];
  }

  /**
   *
   * @see https://github.com/hyle-team/zano/blob/69a5d42d9908b7168247e103b2b40aae8c1fb3f5/src/serialization/stl_containers.h#L88
   */
  private deserializeArray<T>(tag: string, cb: () => T): T[] {
    const array = this.deserializeArrayBegin(true);
    const result: T[] = [];

    for (let i = 0; i < array.length; i++) {
      if (i) {
        this.delimitArray();
      }

      result.push(cb());
    }

    this.endArray();

    return result;
  }

  private read(bytesToRead: number): Uint8Array {
    if (this._archive._buffer.length < this._archive._offset + bytesToRead) {
      throw new Error('Not enough data in buffer');
    }

    const result = this._archive._buffer.subarray(this._archive.offset, this._archive.offset + bytesToRead);

    this._archive._offset += bytesToRead;

    return result;
  }

  private readKeyOffsets(): number[] {
    return this.deserializeArray(null, () => Number(this.readVarint()));
  }

  private readTxinToKey() {
    const txinToKey: any = this.deserializeObjectBegin();

    txinToKey.key_offsets = this.deserializeArray('key_offsets', () =>
      this.readVarint(),
    );
    txinToKey.k_image = this.deserializeBlob(null, sodium.crypto_core_ed25519_BYTES);

    this.deserializeObjectEnd();

    return txinToKey;
  }

  private deserializeUint8() {
    const count = 1;

    const uint8: Buffer = this._archive._buffer.subarray(this._archive._offset, this._archive._offset + count);
    const { length } = uint8;

    if (length !== count) {
      throw new Error(
        `expected to read ${count} bytes of an uint8, but only ${length}`,
      );
    }

    this._archive._offset += count;

    return uint8.readUint8();
  }

  /*
* Deserializes a transaction output to its key components.
*
* @returns {object} An object containing the deserialized key components:
*   - stealth_address: string
*   - concealing_point: string
*   - amount_commitment: string
*   - blinded_asset_id: string
*   - encrypted_amount: string
*   - mix_attr: string
*/
  private deserializeTxoutToKey() {
    return {};
  }

  private deserializeTransactionExtra(bytes: Uint8Array) {
    const buffer: Buffer = Buffer.from(bytes);

    const extra = [];
    do {
      const txExtraUnknown = {
        data: buffer.subarray(this._archive._offset),
      };

      try {
        const variant: number = this.deserializeUint8(); //depending on the transaction version will be deserialized extra

        this.deserializeVariantEnd();
      } catch (_) {
        extra.push({ txExtraUnknown });
        break;
      }
    } while (!this.eof());

    return extra;
  }

  private readTransactionPrefix(prefix: Record<string, unknown>) {
    prefix.version = this.getVarintPackedSize(Number(this.readVarint()));

    if (prefix.version > TRANSACTION_VERSION_PRE_HF4) {
      throw new Error('unsupported version transaction_prefix');
    }

    prefix.vin = this.deserializeArray(null, () => this.readTxinToKey());
    prefix.vout = this.deserializeArray(null, () => this.deserializeTxoutToKey());
    prefix.extra = this.deserializeArray(null, () => this.deserializeUint8());

    return prefix;
  }

  private deserializePublicKey(): Uint8Array {
    return this.deserializeBlob(null, sodium.crypto_core_ed25519_BYTES);
  }

  public deserializeTransaction() {
    const tx: Record<string, unknown> = this.deserializeObjectBegin();
    const prefix: Record<string, unknown> = this.readTransactionPrefix(tx);

    this.deserializeArrayEnd();
  }
}
