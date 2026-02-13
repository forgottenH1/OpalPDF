const fs = require('fs');
const path = require('path');

const adsDir = path.join(__dirname, '../public/ads');
console.log('Scanning directory:', adsDir);

const getImagesRecursively = (dir, fileList = []) => {
    if (!fs.existsSync(dir)) {
        console.log('Directory does not exist:', dir);
        return fileList;
    }
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getImagesRecursively(filePath, fileList);
        } else {
            if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file)) {
                let placement = 'unknown';
                const relativePath = path.relative(adsDir, filePath).replace(/\\/g, '/');

                if (relativePath.includes('sidebar-left')) placement = 'sidebar-left';
                else if (relativePath.includes('sidebar-right')) placement = 'sidebar-right';
                else if (relativePath.includes('header')) placement = 'header';
                else if (relativePath.includes('footer')) placement = 'footer';

                console.log(`Found: ${file} | Path: /ads/${relativePath} | Placement: ${placement}`);

                fileList.push({
                    placement: placement,
                    filename: file,
                    path: `/ads/${relativePath}`
                });
            }
        }
    });
    return fileList;
};

const images = getImagesRecursively(adsDir);
console.log('Total images found:', images.length);
console.log(JSON.stringify(images, null, 2));
