const fs = require('fs');
const path = require('path');

function extractPosts(fileIndex) {
    const text = fs.readFileSync(path.join(__dirname, `../src/data/blogPosts${fileIndex}.ts`), 'utf8');
    const match = text.match(/\[\s*([\s\S]*)\s*\]/);
    if (match) {
        const arrayStr = `[${match[1]}]`;
        return eval(arrayStr);
    }
    return [];
}

try {
    const posts = extractPosts(1);
    console.log(`Found ${posts.length} posts in file 1. id of first is ${posts[0].id}`);
} catch (e) {
    console.error(e);
}
