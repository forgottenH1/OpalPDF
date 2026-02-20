const translate = require('google-translate-api-x');

async function run() {
    try {
        const text = '<h3>Why This Matters for Your Documents</h3><p>To produce lightweight, ultra-professional PDFs, you must leverage both formats properly.</p>';
        const res = await translate(text, { to: 'es' });
        console.log('Original:', text);
        console.log('Translated:', res.text);
    } catch (err) {
        console.error('Error:', err);
    }
}
run();
