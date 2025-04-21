"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSRV = void 0;
const dns_1 = __importDefault(require("dns"));
const net_1 = __importDefault(require("net"));
function resolveSRV(host, protocol = 'tcp') {
    return new Promise((resolve) => {
        // If the host already is an IPV4 address, we do not need to do an SRV lookup.
        if (net_1.default.isIPv4(host)) {
            resolve(null);
        }
        dns_1.default.resolveSrv(`_minecraft._${protocol}.${host}`, (error, addresses) => {
            if (error || addresses.length < 1)
                return resolve(null);
            const address = addresses[0];
            resolve({ host: address.name, port: address.port });
        });
    });
}
exports.resolveSRV = resolveSRV;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3J2UmVjb3JkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvc3J2UmVjb3JkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFzQjtBQUN0Qiw4Q0FBc0I7QUFHdEIsU0FBZ0IsVUFBVSxDQUFDLElBQVksRUFBRSxRQUFRLEdBQUcsS0FBSztJQUN4RCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFFOUIsOEVBQThFO1FBQzlFLElBQUksYUFBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDZDtRQUVELGFBQUcsQ0FBQyxVQUFVLENBQUMsZUFBZSxRQUFRLElBQUksSUFBSSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDdEUsSUFBSSxLQUFLLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDO2dCQUFFLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3QixPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFoQkQsZ0NBZ0JDIn0=