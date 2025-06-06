/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'events';
declare class UDPClient extends EventEmitter {
    private host;
    private port;
    private socket;
    private data;
    constructor(host: string, port: number);
    readByte(): Promise<number>;
    writeByte(value: number): void;
    readBytes(length: number): Promise<Buffer>;
    writeBytes(data: Uint8Array): void;
    readUInt8(): Promise<number>;
    writeUInt8(value: number): void;
    readInt8(): Promise<number>;
    writeInt8(value: number): void;
    readUInt16BE(): Promise<number>;
    writeUInt16BE(value: number): void;
    readInt16BE(): Promise<number>;
    writeInt16BE(value: number): void;
    readUInt16LE(): Promise<number>;
    writeUInt16LE(value: number): void;
    readInt16LE(): Promise<number>;
    writeInt16LE(value: number): void;
    readUInt32BE(): Promise<number>;
    writeUInt32BE(value: number): void;
    readInt32BE(): Promise<number>;
    writeInt32BE(value: number): void;
    readUInt32LE(): Promise<number>;
    writeUInt32LE(value: number): void;
    readInt32LE(): Promise<number>;
    writeInt32LE(value: number): void;
    readUInt64BE(): Promise<bigint>;
    writeUInt64BE(value: bigint): void;
    readInt64BE(): Promise<bigint>;
    writeInt64BE(value: bigint): void;
    readUInt64LE(): Promise<bigint>;
    writeUInt64LE(value: bigint): void;
    readInt64LE(): Promise<bigint>;
    writeInt64LE(value: bigint): void;
    readFloatBE(): Promise<number>;
    writeFloatBE(value: number): void;
    readFloatLE(): Promise<number>;
    writeFloatLE(value: number): void;
    readDoubleBE(): Promise<number>;
    writeDoubleBE(value: number): void;
    readDoubleLE(): Promise<number>;
    writeDoubleLE(value: number): void;
    readVarInt(): Promise<number>;
    writeVarInt(value: number): void;
    readString(length: number): Promise<string>;
    writeString(value: string): void;
    readStringVarInt(): Promise<string>;
    writeStringVarInt(value: string): void;
    readStringNT(): Promise<string>;
    readStringNTFollowedBy(suffixes: Buffer[]): Promise<string>;
    checkUpcomingData(suffixes: Buffer[]): Promise<Buffer | null>;
    writeStringNT(value: string): void;
    writeStringBytes(value: string): void;
    flush(prefixLength?: boolean): Promise<void>;
    close(): void;
    ensureBufferedData(byteLength: number): Promise<void>;
    _waitForData(byteLength?: number): Promise<void>;
    hasRemainingData(): boolean;
}
export default UDPClient;
