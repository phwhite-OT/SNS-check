const fetch = require('node-fetch');

async function testDashboard() {
    const API_BASE = 'http://127.0.0.1:3001/api';
    const userId = '00000000-0000-0000-0000-000000000000';
    console.log(`Testing dashboard for user: ${userId}`);

    try {
        const res = await fetch(`${API_BASE}/dashboard`, {
            headers: { 'x-user-id': userId }
        });
        if (!res.ok) {
            console.error('Fetch failed:', res.status, res.statusText);
            const text = await res.text();
            console.error('Error body:', text);
            return;
        }
        const data = await res.json();
        console.log('--- Dashboard Summary ---');
        console.log('Score:', data.score);
        console.log('Total Time Seconds:', data.totalTimeSeconds);
        console.log('Site Breakdown Length:', data.siteBreakdown.length);
        if (data.siteBreakdown.length > 0) {
            console.log('First 5 items:');
            data.siteBreakdown.slice(0, 5).forEach(i => {
                console.log(`- ${i.domain}: ${i.timeSpent}min, ${i.visits} visits`);
            });
        } else {
            console.log('SITE BREAKDOWN IS EMPTY!');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testDashboard();
