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
const assert_1 = __importDefault(require("assert"));
const util_1 = require("util");
const Packet_1 = __importDefault(require("./structure/Packet"));
const TCPSocket_1 = __importDefault(require("./structure/TCPSocket"));
const formatResultFE01FA_1 = __importDefault(require("./util/formatResultFE01FA"));
const resolveSRV_1 = __importDefault(require("./util/resolveSRV"));
const ipAddressRegEx = /^\d{1,3}(\.\d{1,3}){3}$/;
const decoder = new util_1.TextDecoder('utf-16be');
function applyDefaultOptions(options) {
    // Apply the provided options on the default options
    return Object.assign({
        port: 25565,
        protocolVersion: 47,
        timeout: 1000 * 5,
        enableSRV: true
    }, options);
}
/**
 * Retrieves the status of the server using the 1.4.2 - 1.5.2 format.
 * @param {string} host The host of the server
 * @param {StatusOptions} [options] The options to use when retrieving the status
 * @returns {Promise<StatusResponse>} The status information of the server
 * @async
 */
function statusFE01(host, options) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Applies the provided options on top of the default options
        const opts = applyDefaultOptions(options);
        // Assert that the arguments are the correct type and format
        (0, assert_1.default)(typeof host === 'string', `Expected 'host' to be a string, got ${typeof host}`);
        (0, assert_1.default)(host.length > 0, 'Expected \'host\' to have content, got an empty string');
        (0, assert_1.default)(typeof options === 'object' || typeof options === 'undefined', `Expected 'options' to be an object or undefined, got ${typeof options}`);
        (0, assert_1.default)(typeof opts === 'object', `Expected 'options' to be an object, got ${typeof opts}`);
        (0, assert_1.default)(typeof opts.port === 'number', `Expected 'options.port' to be a number, got ${typeof opts.port}`);
        (0, assert_1.default)(opts.port > 0, `Expected 'options.port' to be greater than 0, got ${opts.port}`);
        (0, assert_1.default)(opts.port < 65536, `Expected 'options.port' to be less than 65536, got ${opts.port}`);
        (0, assert_1.default)(Number.isInteger(opts.port), `Expected 'options.port' to be an integer, got ${opts.port}`);
        (0, assert_1.default)(typeof opts.protocolVersion === 'number', `Expected 'options.protocolVersion' to be a number, got ${typeof opts.protocolVersion}`);
        (0, assert_1.default)(opts.protocolVersion >= 0, `Expected 'options.protocolVersion' to be greater than or equal to 0, got ${opts.protocolVersion}`);
        (0, assert_1.default)(Number.isInteger(opts.protocolVersion), `Expected 'options.protocolVersion' to be an integer, got ${opts.protocolVersion}`);
        (0, assert_1.default)(typeof opts.timeout === 'number', `Expected 'options.timeout' to be a number, got ${typeof opts.timeout}`);
        (0, assert_1.default)(opts.timeout > 0, `Expected 'options.timeout' to be greater than 0, got ${opts.timeout}`);
        (0, assert_1.default)(typeof opts.enableSRV === 'boolean', `Expected 'options.enableSRV' to be a boolean, got ${typeof opts.enableSRV}`);
        let srvRecord = null;
        // Automatically resolve from host (e.g. play.hypixel.net) into a connect-able address
        if (opts.enableSRV && !ipAddressRegEx.test(host)) {
            srvRecord = yield (0, resolveSRV_1.default)(host);
        }
        const startTime = Date.now();
        // Create a new TCP connection to the specified address
        const socket = yield TCPSocket_1.default.connect((_a = srvRecord === null || srvRecord === void 0 ? void 0 : srvRecord.host) !== null && _a !== void 0 ? _a : host, (_b = srvRecord === null || srvRecord === void 0 ? void 0 : srvRecord.port) !== null && _b !== void 0 ? _b : opts.port, opts.timeout);
        try {
            // Create the necessary packets and send them to the server
            {
                // https://wiki.vg/Server_List_Ping#1.4_to_1.5
                const packet = new Packet_1.default();
                packet.writeByte(0xFE, 0x01);
                socket.writePacket(packet, false);
            }
            let protocolVersion = 0;
            let serverVersion = '';
            let motd = '';
            let playerCount = 0;
            let maxPlayers = 0;
            {
                const packetType = yield socket.readByte();
                // Packet was unexpected type, ignore the rest of the data in this packet
                if (packetType !== 0xFF)
                    throw new Error('Packet returned from server was unexpected type');
                // Read the length of the data string
                const length = yield socket.readShort();
                // Read all of the data string and convert to a UTF-8 string
                const data = decoder.decode(yield socket.readBytes(length * 2));
                let protocolVersionStr, playerCountStr, maxPlayersStr;
                // 1.4+ server
                if (data[0] == '§' || data[1] == '1') {
                    const split = data.split('\0');
                    protocolVersion = parseInt(split[1]);
                    serverVersion = split[2];
                    motd = split[3];
                    playerCount = parseInt(split[4]);
                    maxPlayers = parseInt(split[5]);
                }
                else {
                    // < 1.4 server
                    const split = data.split('§');
                    protocolVersion = 0;
                    serverVersion = '1.3';
                    motd = split[0];
                    playerCount = parseInt(split[1]);
                    maxPlayers = parseInt(split[2]);
                }
                if (isNaN(protocolVersion))
                    throw new Error('Server returned an invalid protocol version: ' + protocolVersionStr);
                if (isNaN(playerCount))
                    throw new Error('Server returned an invalid player count: ' + playerCountStr);
                if (isNaN(maxPlayers))
                    throw new Error('Server returned an invalid max player count: ' + maxPlayersStr);
            }
            // Convert the data from raw Minecraft status payload format into a more human readable format and resolve the promise
            return (0, formatResultFE01FA_1.default)(host, opts.port, srvRecord, protocolVersion, serverVersion, motd, playerCount, maxPlayers, Date.now() - startTime);
        }
        finally {
            // Destroy the socket, it is no longer needed
            yield socket.destroy();
        }
    });
}
exports.default = statusFE01;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzRkUwMUFsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9zdGF0dXNGRTAxQWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQTRCO0FBQzVCLCtCQUFtQztBQUNuQyxnRUFBd0M7QUFDeEMsc0VBQThDO0FBQzlDLG1GQUEyRDtBQUMzRCxtRUFBMEQ7QUFJMUQsTUFBTSxjQUFjLEdBQUcseUJBQXlCLENBQUM7QUFDakQsTUFBTSxPQUFPLEdBQUcsSUFBSSxrQkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRTVDLFNBQVMsbUJBQW1CLENBQUMsT0FBdUI7SUFDbkQsb0RBQW9EO0lBQ3BELE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNwQixJQUFJLEVBQUUsS0FBSztRQUNYLGVBQWUsRUFBRSxFQUFFO1FBQ25CLE9BQU8sRUFBRSxJQUFJLEdBQUcsQ0FBQztRQUNqQixTQUFTLEVBQUUsSUFBSTtLQUNZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQThCLFVBQVUsQ0FBQyxJQUFZLEVBQUUsT0FBdUI7OztRQUM3RSw2REFBNkQ7UUFDN0QsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFMUMsNERBQTREO1FBQzVELElBQUEsZ0JBQU0sRUFBQyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsdUNBQXVDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2RixJQUFBLGdCQUFNLEVBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsd0RBQXdELENBQUMsQ0FBQztRQUNsRixJQUFBLGdCQUFNLEVBQUMsT0FBTyxPQUFPLEtBQUssUUFBUSxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRSx3REFBd0QsT0FBTyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ2hKLElBQUEsZ0JBQU0sRUFBQyxPQUFP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