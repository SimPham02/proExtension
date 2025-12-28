// Script Node.js: Tự động sinh features.js từ thư mục features
const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'features');
const outFile = path.join(__dirname, 'features.js');

const features = [];

fs.readdirSync(featuresDir, { withFileTypes: true }).forEach(dirent => {
    if (dirent.isDirectory()) {
        const key = dirent.name;
        // Đọc tên hiển thị từ manifest.json nếu có, không thì dùng tên thư mục
        let name = key;
        const manifestPath = path.join(featuresDir, key, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                if (manifest.name) name = manifest.name;
            } catch {}
        }
        features.push({
            key,
            name,
            ui: `features/${key}/ui.html`,
            logic: `features/${key}/logic.js`
        });
    }
});

const js = `export const FEATURES = [\n` + features.map(f => `  {\n    key: '${f.key}',\n    name: '${f.name}',\n    ui: '${f.ui}',\n    logic: async () => (await import('./${f.logic}'))\n  }`).join(',\n') + '\n];\n';

fs.writeFileSync(outFile, js);
console.log('Generated features.js!');
