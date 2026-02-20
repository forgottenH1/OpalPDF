const translate = require('google-translate-api-x');

async function run() {
    try {
        const texts = ['Hello world', 'How are you?'];
        const res = await translate(texts, { to: 'es' });
        console.log(res.map(r => r.text));
    } catch (err) {
        console.error('Error:', err);
    }
}
run();
