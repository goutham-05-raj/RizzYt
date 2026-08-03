import fs from 'fs';
import path from 'path';

const src = "C:\\Users\\deepi\\Downloads\\Spiderman (1).png";
const destDir = "C:\\Users\\deepi\\Extension Work\\YouTubeSummarizer\\public\\icons";

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, path.join(destDir, "icon128.png"));
fs.copyFileSync(src, path.join(destDir, "icon48.png"));
fs.copyFileSync(src, path.join(destDir, "icon16.png"));
console.log("Real Spiderman PNG copied successfully!");
