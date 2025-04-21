import dns from 'dns';
import net from 'net';
import { SRVRecord } from '../types/SRVRecord';

export function resolveSRV(host: string, protocol = 'tcp'): Promise<SRVRecord | null> {
	return new Promise((resolve) => {

		// If the host already is an IPV4 address, we do not need to do an SRV lookup.
		if (net.isIPv4(host)) {
			resolve(null);
		}

		dns.resolveSrv(`_minecraft._${protocol}.${host}`, (error, addresses) => {
			if (error || addresses.length < 1) return resolve(null);

			const address = addresses[0];

			resolve({ host: address.name, port: address.port });
		});
	});
}
