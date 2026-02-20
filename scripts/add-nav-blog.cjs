const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

// We also need to add 'blog': 'Blog' to English manually
const enPath = path.join(__dirname, '../src/locales/en/translation.json');
let enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
enJson.nav.blog = "Blog";
fs.writeFileSync(enPath, JSON.stringify(enJson, null, 4), 'utf8');
console.log('Added to English');

const TARGET_LANGS = ['ar', 'de', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'tr', 'uk', 'zh'];

function getGoogleLangCode(lang) {
    if (lang === 'zh') return 'zh-CN';
    return lang;
}

async function run() {
    for (const lang of TARGET_LANGS) {
        const targetLang = getGoogleLangCode(lang);
        const jsonPath = path.join(__dirname, `../src/locales/${lang}/translation.json`);

        let translations = {};
        if (fs.existsSync(jsonPath)) {
            translations = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        }

        try {
            const res = await translate("Blog", { to: targetLang });
            if (!translations.nav) translations.nav = {};
            translations.nav.blog = res.text;

            fs.writeFileSync(jsonPath, JSON.stringify(translations, null, 4), 'utf8');
            console.log(`Translated 'Blog' to ${lang}: ${res.text}`);
        } catch (e) {
            console.error(`Failed ${lang}:`, e.message);
        }
    }
}
run();
