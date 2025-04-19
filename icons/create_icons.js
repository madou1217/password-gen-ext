// 这是一个在Node.js环境中运行的脚本，用于创建简单的svg图标
// 你可以使用这个脚本生成图标，或者自己创建图标文件

const fs = require('fs');
const path = require('path');

// SVG图标模板
const svgTemplate = `<svg width="SIZE" height="SIZE" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="15" fill="#4285f4"/>
  <circle cx="50" cy="35" r="15" fill="white"/>
  <rect x="35" y="50" width="30" height="35" rx="5" fill="white"/>
  <rect x="45" y="60" width="10" height="15" rx="2" fill="#4285f4"/>
</svg>`;

// 创建不同尺寸的图标
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svgContent = svgTemplate.replace(/SIZE/g, size);
  const filePath = path.join(__dirname, `icon${size}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created ${filePath}`);
});

console.log('请将SVG图标转换为PNG格式，可以使用在线工具或其他工具进行转换');
console.log('然后将生成的PNG图标放在icons目录下，命名为icon16.png, icon48.png, icon128.png'); 