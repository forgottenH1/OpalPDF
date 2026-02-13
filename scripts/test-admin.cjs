
const http = require('http');

const advertiserData = {
    id: Date.now().toString(),
    companyName: 'Stellar Gadgets',
    contactName: 'Alex Orion',
    email: 'ads@stellargadgets.com',
    tier: 'gold',
    notes: 'Premium partner',
    website: 'https://stellargadgets.com'
};

const campaignData = {
    id: Date.now().toString(),
    advertiserId: advertiserData.id,
    placement: 'header',
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    imageUrl: 'https://placehold.co/728x90/4F46E5/FFFFFF?text=Stellar+Gadgets+Sale',
    link: 'https://example.com/summer-sale'
};

function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: body ? JSON.parse(body) : null });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTest() {
    console.log('--- Starting Admin API Test ---');

    try {
        // 1. Get existing advertisers
        console.log('\n[1] Fetching Advertisers...');
        let res = await makeRequest('/api/advertisers', 'GET');
        console.log('Status:', res.statusCode);
        console.log('Current Count:', res.body.length);
        const initialCount = res.body.length;

        // 2. Add new advertiser
        console.log('\n[2] Adding "Stellar Gadgets"...');
        const newList = [...res.body, advertiserData];
        res = await makeRequest('/api/advertisers', 'POST', newList);
        console.log('Status:', res.statusCode);

        // 3. Verify addition
        console.log('\n[3] Verifying Advertiser Addition...');
        res = await makeRequest('/api/advertisers', 'GET');
        console.log('Status:', res.statusCode);
        console.log('New Count:', res.body.length);
        if (res.body.length === initialCount + 1) {
            console.log('SUCCESS: Advertiser added.');
        } else {
            console.error('FAILURE: Advertiser count mismatch.');
        }

        // 4. Get existing campaigns
        console.log('\n[4] Fetching Campaigns...');
        res = await makeRequest('/api/campaigns', 'GET');
        console.log('Status:', res.statusCode);
        const initialCampaignCount = res.body.length;

        // 5. Add new campaign
        console.log('\n[5] Adding "Summer Sale" Campaign...');
        const newCampaignList = [...res.body, campaignData];
        res = await makeRequest('/api/campaigns', 'POST', newCampaignList);
        console.log('Status:', res.statusCode);

        // 6. Verify campaign addition
        console.log('\n[6] Verifying Campaign Addition...');
        res = await makeRequest('/api/campaigns', 'GET');
        console.log('Status:', res.statusCode);
        console.log('New Campaign Count:', res.body.length);
        if (res.body.length === initialCampaignCount + 1) {
            console.log('SUCCESS: Campaign added.');
        } else {
            console.error('FAILURE: Campaign count mismatch.');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTest();
