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
            // const payload = crypto.randomBytes(8).readBigInt64BE();
            //
            // // Ping packet
            // // https://wiki.vg/Server_List_Ping#Ping
            // {
            // 	socket.writeVarInt(0x01);
            // 	socket.writeInt64BE(payload);
            // 	await socket.flush();
            // }
            //
            // const pingStart = Date.now();
            //
            // // Pong packet
            // // https://wiki.vg/Server_List_Ping#Pong
            // {
            // 	const packetLength = await socket.readVarInt();
            // 	await socket.ensureBufferedData(packetLength);
            //
            // 	const packetType = await socket.readVarInt();
            // 	if (packetType !== 0x01) throw new Error('Expected server to send packet type 0x01, received ' + packetType);
            //
            // 	const receivedPayload = await socket.readInt64BE();
            // 	if (receivedPayload !== payload) throw new Error('Ping payload did not match received payload');
            // }
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
                roundTripLatency: 0, // TODO fixen
                // roundTripLatency: Date.now() - pingStart
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3N0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBNEI7QUFFNUIsNkRBQW1FO0FBQ25FLHNFQUE4QztBQUc5QyxnREFBOEM7QUFDOUMsMkNBQXNDO0FBRXRDLFNBQWdCLE1BQU0sQ0FBQyxJQUFZLEVBQUUsSUFBSSxHQUFHLEtBQUssRUFBRSxPQUEyQjtJQUM3RSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBRW5CLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQy9GLElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsMENBQTBDLE9BQU8sSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMzRixJQUFBLGdCQUFNLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSwwQ0FBMEMsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNsRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSwwREFBMEQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNyRixJQUFBLGdCQUFNLEVBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSwyREFBMkQsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUMxRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRSw2REFBNkQsT0FBTyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBRXRKLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFO1FBQ2hDLElBQUEs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