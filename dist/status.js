"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.status = void 0;
const assert_1 = __importDefault(require("assert"));
const crypto_1 = __importDefault(require("crypto"));
const minecraft_motd_util_1 = require("minecraft-motd-util");
const TCPClient_1 = __importDefault(require("./structure/TCPClient"));
const srvRecord_1 = require("./util/srvRecord");
const jsonrepair_1 = require("jsonrepair");
function status(host, port = 25565, options) {
    host = host.trim();
    (0, assert_1.default)(typeof host === 'string', `Expected 'host' to be a 'string', got '${typeof host}'`);
    (0, assert_1.default)(host.length > 1, `Expected 'host' to have a length greater than 0, got ${host.length}`);
    (0, assert_1.default)(typeof port === 'number', `Expected 'port' to be a 'number', got '${typeof port}'`);
    (0, assert_1.default)(Number.isInteger(port), `Expected 'port' to be an integer, got '${port}'`);
    (0, assert_1.default)(port >= 0, `Expected 'port' to be greater than or equal to 0, got '${port}'`);
    (0, assert_1.default)(port <= 65535, `Expected 'port' to be less than or equal to 65535, got '${port}'`);
    (0, assert_1.default)(typeof options === 'object' || typeof options === 'undefined', `Expected 'options' to be an 'object' or 'undefined', got '${typeof options}'`);
    if (typeof options === 'object') {
        (0, assert_1.default)(typeof options.enableSRV === 'boolean' || typeof options.enableSRV === 'undefined', `Expected 'options.enableSRV' to be a 'boolean' or 'undefined', got '${typeof options.enableSRV}'`);
        (0, assert_1.default)(typeof options.timeout === 'number' || typeof options.timeout === 'undefined', `Expected 'options.timeout' to be a 'number' or 'undefined', got '${typeof options.timeout}'`);
        if (typeof options.timeout === 'number') {
            (0, assert_1.default)(Number.isInteger(options.timeout), `Expected 'options.timeout' to be an integer, got '${options.timeout}'`);
            (0, assert_1.default)(options.timeout >= 0, `Expected 'options.timeout' to be greater than or equal to 0, got '${options.timeout}'`);
        }
    }
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const socket = new TCPClient_1.default();
        const timeout = setTimeout(() => {
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(new Error('Server is offline or unreachable'));
        }, (_a = options === null || options === void 0 ? void 0 : options.timeout) !== null && _a !== void 0 ? _a : 1000 * 5);
        try {
            let srvRecord = null;
            if (typeof options === 'undefined' || typeof options.enableSRV === 'undefined' || options.enableSRV) {
                srvRecord = yield (0, srvRecord_1.resolveSRV)(host);
                if (srvRecord) {
                    host = srvRecord.host;
                    port = srvRecord.port;
                }
            }
            yield socket.connect({ host, port, timeout: (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : 1000 * 5 });
            // Handshake packet
            // https://wiki.vg/Server_List_Ping#Handshake
            {
                socket.writeVarInt(0x00);
                socket.writeVarInt((_c = options === null || options === void 0 ? void 0 : options.protocol) !== null && _c !== void 0 ? _c : -1);
                socket.writeStringVarInt(host);
                socket.writeUInt16BE(port);
                socket.writeVarInt(1);
                yield socket.flush();
            }
            // Request packet
            // https://wiki.vg/Server_List_Ping#Request
            {
                socket.writeVarInt(0x00);
                yield socket.flush();
            }
            let response;
            // Response packet
            // https://wiki.vg/Server_List_Ping#Response
            {
                const packetLength = yield socket.readVarInt();
                yield socket.ensureBufferedData(packetLength);
                const packetType = yield socket.readVarInt();
                if (packetType !== 0x00)
                    throw new Error('Expected server to send packet type 0x00, received ' + packetType);
                const packetResponse = yield socket.readStringVarInt();
                try {
                    response = JSON.parse(packetResponse);
                }
                catch (e) {
                    // If parsing the JSON response fails, try repairing the string first.
                    const fixedPacketResponse = (0, jsonrepair_1.jsonrepair)(packetResponse);
                    response = JSON.parse(fixedPacketResponse);
                }
            }
            const payload = crypto_1.default.randomBytes(8).readBigInt64BE();
            // Ping packet
            // https://wiki.vg/Server_List_Ping#Ping
            {
                socket.writeVarInt(0x01);
                socket.writeInt64BE(payload);
                yield socket.flush();
            }
            const pingStart = Date.now();
            // Pong packet
            // https://wiki.vg/Server_List_Ping#Pong
            {
                const packetLength = yield socket.readVarInt();
                yield socket.ensureBufferedData(packetLength);
                const packetType = yield socket.readVarInt();
                if (packetType !== 0x01)
                    throw new Error('Expected server to send packet type 0x01, received ' + packetType);
                const receivedPayload = yield socket.readInt64BE();
                if (receivedPayload !== payload)
                    throw new Error('Ping payload did not match received payload');
            }
            const motd = (0, minecraft_motd_util_1.parse)(response.description);
            clearTimeout(timeout);
            socket.close();
            resolve({
                version: {
                    name: response.version.name,
                    protocol: response.version.protocol
                },
                players: {
                    online: response.players.online,
                    max: response.players.max,
                    sample: (_d = response.players.sample) !== null && _d !== void 0 ? _d : null
                },
                motd: {
                    raw: (0, minecraft_motd_util_1.format)(motd),
                    clean: (0, minecraft_motd_util_1.clean)(motd),
                    html: (0, minecraft_motd_util_1.toHTML)(motd)
                },
                favicon: (_e = response.favicon) !== null && _e !== void 0 ? _e : null,
                srvRecord,
                roundTripLatency: Date.now() - pingStart
            });
        }
        catch (e) {
            clearTimeout(timeout);
            socket === null || socket === void 0 ? void 0 : socket.close();
            reject(e);
        }
    }));
}
exports.status = status;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBNEI7QUFDNUIsb0RBQTRCO0FBQzVCLDZEQUFtRTtBQUNuRSxzRUFBOEM7QUFHOUMsZ0RBQThDO0FBQzlDLDJDQUFzQztBQUV0QyxTQUFnQixNQUFNLENBQUMsSUFBWSxFQUFFLElBQUksR0FBRyxLQUFLLEVBQUUsT0FBMkI7SUFDN0UsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVuQixJQUFBLGdCQUFNLEVBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLDBDQUEwQyxPQUFPLElBQUksR0FBRyxDQUFDLENBQUM7SUFDM0YsSUFBQSxnQkFBTSxFQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdEQUF3RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUMvRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFLDBDQUEwQyxPQUFPLElBQUksR0FBRyxDQUFDLENBQUM7SUFDM0YsSUFBQSxnQkFBTSxFQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsMENBQTBDLElBQUksR0FBRyxDQUFDLENBQUM7SUFDbEYsSUFBQSxnQkFBTSxFQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsMERBQTBELElBQUksR0FBRyxDQUFDLENBQUM7SUFDckYsSUFBQSxnQkFBTSxFQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsMkRBQTJELElBQUksR0FBRyxDQUFDLENBQUM7SUFDMUYsSUFBQSxnQkFBTSxFQUFDLE9BQU8sT0FBTyxLQUFLLFFBQVEsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUUsNkRBQTZELE9BQU8sT0FBTyxHQUFHLENBQUMsQ0FBQztJQUV0SixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFB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