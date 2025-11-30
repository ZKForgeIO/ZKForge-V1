import http from 'http';

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function testContentType() {
    console.log('Testing Content-Type Validation...');
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        }
    };

    return new Promise((resolve) => {
        const req = http.request(`${BASE_URL}/auth/signin`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 415) {
                    console.log('✅ Content-Type validation passed (415 Unsupported Media Type)');
                } else {
                    console.error(`❌ Content-Type validation failed (Status: ${res.statusCode})`);
                }
                resolve();
            });
        });
        req.on('error', (e) => {
            console.error(`❌ Request failed: ${e.message}`);
            resolve();
        });
        req.write('test');
        req.end();
    });
}

async function runTests() {
    // Wait for server to potentially start if we were running it, 
    // but here we assume it's running or we'll just test against the port.
    // Ideally we'd start the server here but for this environment we might just check code.
    // Since I cannot easily start the full server with DB connection in this script without env vars,
    // I will rely on the unit test logic or just manual code review confirmation if server isn't running.

    // However, I can try to hit the health endpoint first.

    await testContentType();
}

runTests();
