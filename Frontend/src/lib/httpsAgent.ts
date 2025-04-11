import https from 'https';
import fs from 'fs';
import path from 'path';

export const httpsAgent = new https.Agent({
    rejectUnauthorized: true,
    ca: fs.readFileSync('/etc/nginx/ssl/transcendence.pem'),
});