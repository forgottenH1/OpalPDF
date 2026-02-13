
const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function runTest() {
    console.log('--- Testing /api/images ---');
    try {
        const res = await makeRequest('/api/images');
        console.log('Status:', res.statusCode);
        console.log('Images Found:', res.body.length);
        if (res.body.length > 0) {
            console.log('Sample Image:', res.body[0]);
            console.log('SUCCESS: API is returning images.');
        } else {
            console.warn('WARNING: API returned 0 images. Check public/ads folders.');
        }
    } catch (error) {
        console.error('FAILED:', error.message);
    }
}

runTest();
