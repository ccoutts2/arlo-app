// Creates a throwaway self-signed certificate for localhost, used by the fake push service in
// e2e tests. The test server trusts only this certificate (NODE_EXTRA_CA_CERTS), so TLS checks
// stay on for everything else.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const dir = 'e2e/.cert';
if (!fs.existsSync(`${dir}/cert.pem`)) {
	fs.mkdirSync(dir, { recursive: true });
	execFileSync('openssl', [
		'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '3650',
		'-keyout', `${dir}/key.pem`, '-out', `${dir}/cert.pem`,
		'-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1'
	], { stdio: 'ignore' });
	console.log('test-cert: created e2e/.cert');
}
