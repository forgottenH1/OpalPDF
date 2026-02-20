const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const TARGET_LANGS = ['zh'];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function extractPosts() {
    let allPosts = [];
    for (let i = 1; i <= 5; i++) {
        const filePath = path.join(__dirname, `../src/data/blogPosts${i}.ts`);
        const text = fs.readFileSync(filePath, 'utf8');
        const match = text.match(/\[\s*([\s\S]*)\s*\]/);
        if (match) {
            allPosts = allPosts.concat(eval(`[${match[1]}]`));
        }
    }
    return allPosts;
}

// Maps our locale keys to google translate keys if needed
function getGoogleLangCode(lang) {
    if (lang === 'zh') return 'zh-CN'; // Simplified Chinese
    return lang;
}

async function translateAll() {
    const posts = extractPosts();
    console.log(`Extracted ${posts.length} posts. Beginning translation...`);

    for (const lang of TARGET_LANGS) {
        console.log(`\n--- Starting translation for: ${lang.toUpperCase()} ---`);
        const targetLang = getGoogleLangCode(lang);
        const jsonPath = path.join(__dirname, `../src/locales/${lang}/translation.json`);

        let translations = {};
        if (fs.existsSync(jsonPath)) {
            translations = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } else {
            console.error(`Missing translation file for ${lang}! Skipping...`);
            continue;
        }

        if (!translations.blogData) {
            translations.blogData = {};
        }

        let addedCount = 0;

        for (const post of posts) {
            if (translations.blogData[post.id] && translations.blogData[post.id].title) {
                // Skip if already translated
                continue;
            }

            try {
                process.stdout.write(`Translating ${post.id}... `);

                // Translate title, excerpt, and content in one batch
                const res = await translate([post.title, post.excerpt, post.content], { to: targetLang });

                translations.blogData[post.id] = {
                    title: res[0].text,
                    excerpt: res[1].text,
                    content: res[2].text
                };

                // Save incrementally in case of crash
                fs.writeFileSync(jsonPath, JSON.stringify(translations, null, 4), 'utf8');

                process.stdout.write('Done.\n');
                addedCount++;

                // Prevent rate limiting (1 second delay)
                await sleep(1000);
            } catch (err) {
                console.error(`\nError translating post ${post.id}:`, err.message);
                if (err.statusCode === 429) {
                    console.log("Rate limited! Waiting 30 seconds...");
                    await sleep(30000); // Wait 30s
                } else {
                    await sleep(5000);
                }
            }
        }

        console.log(`Finished ${lang}. Added ${addedCount} new translations.`);
        // Take a small break between languages
        await sleep(2000);
    }

    console.log("All translations completed successfully.");
}

translateAll();
