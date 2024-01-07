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
        var _a, _b, _c, _d, _e, _f;
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
            const protocol = (_b = options === null || options === void 0 ? void 0 : options.protocol) !== null && _b !== void 0 ? _b : -1;
            yield socket.connect({ host, port, timeout: (_c = options === null || options === void 0 ? void 0 : options.timeout) !== null && _c !== void 0 ? _c : 1000 * 5 });
            // Handshake packet
            // https://wiki.vg/Server_List_Ping#Handshake
            {
                socket.writeVarInt(0x00);
                socket.writeVarInt(protocol);
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
                    protocol: (_d = response.version.protocol) !== null && _d !== void 0 ? _d : protocol,
                },
                players: {
                    online: response.players.online,
                    max: response.players.max,
                    sample: (_e = response.players.sample) !== null && _e !== void 0 ? _e : null
                },
                motd: {
                    raw: (0, minecraft_motd_util_1.format)(motd),
                    clean: (0, minecraft_motd_util_1.clean)(motd),
                    html: (0, minecraft_motd_util_1.toHTML)(motd)
                },
                favicon: (_f = response.favicon) !== null && _f !== void 0 ? _f : null,
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