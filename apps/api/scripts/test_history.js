const fetch = require('node-fetch');

async function testHistory() {
    const url = 'http://localhost:3001/api/history';
    const payload = {
        history: [
            {
                url: 'https://www.youtube.com/watch?v=debug',
                title: 'Debug Video',
                lastVisitTime: Date.now()
            },
            {
                url: 'https://github.com/debug',
                title: 'Debug Code',
                lastVisitTime: Date.now()
            }
        ]
    };

    console.log('Sending test history to:', url);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

testHistory();
