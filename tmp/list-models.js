const https = require('https');
const fs = require('fs');

function getApiKey() {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        const match = env.match(/GEMINI_API_KEY=(.*)/);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

const apiKey = getApiKey();

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Supported Models:");
                json.models.forEach(m => console.log(`- ${m.name}`));
            } else {
                console.log("Error Response:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("Error parsing response:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Request Error:", e.message);
});
