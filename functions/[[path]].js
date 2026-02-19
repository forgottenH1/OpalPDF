export async function onRequest({ request, next, waitUntil }) {
    // Pass the request to the next handler
    const response = await next();

    // If the response is not successful, don't ping
    if (response.status !== 200) {
        return response;
    }

    const url = new URL(request.url);

    // Filter out assets to prevent spamming IndexNow
    // Only ping for HTML pages (either no extension or .html)
    // And ignore the verification file itself
    const isPage = (!url.pathname.includes('.') || url.pathname.endsWith('.html'));
    const isIgnored = url.pathname.includes('8bf50b9f2f8644a9a2c0af27389d21a9.txt');

    if (isPage && !isIgnored) {
        const endpoint = 'https://api.indexnow.org/indexnow';

        // Construct the payload for Bing IndexNow
        const body = {
            host: 'opalpdf.com',
            key: '8bf50b9f2f8644a9a2c0af27389d21a9',
            keyLocation: 'https://opalpdf.com/8bf50b9f2f8644a9a2c0af27389d21a9.txt',
            urlList: [url.origin + url.pathname] // Use canonical URL without query params
        };

        // Use waitUntil to perform the fetch asynchronously without blocking the response
        waitUntil(
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify(body),
            }).then(res => {
                // Optional: Log success/failure if needed, but console logs in Pages Functions
                // are only visible in the Cloudflare dashboard.
                if (!res.ok) {
                    console.error('IndexNow Ping Failed:', res.status, res.statusText);
                }
            }).catch(err => {
                console.error('IndexNow Ping Error:', err);
            })
        );
    }

    return response;
}
