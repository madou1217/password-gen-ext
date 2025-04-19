# 图标文件说明

Chrome/Edge扩展需要PNG格式的图标文件。这个目录中已经包含了SVG格式的图标，但您需要将它们转换为PNG格式才能使扩展正常工作。

## 转换方法

1. 在线转换工具：
   - 访问 https://svgtopng.com/ 或类似的在线转换工具
   - 上传SVG文件并下载PNG版本
   - 确保保持原始尺寸（16x16, 48x48, 128x128）

2. 使用图像编辑软件：
   - 使用Photoshop, GIMP, Inkscape等软件打开SVG文件
   - 导出为PNG格式
   - 确保文件命名为`icon16.png`, `icon48.png`和`icon128.png`

## 临时解决方案

如果您暂时无法转换图标，可以修改manifest.json文件，直接使用SVG图标。修改方法：

```json
"action": {
  "default_popup": "popup.html",
  "default_icon": {
    "16": "icons/icon16.svg",
    "48": "icons/icon48.svg",
    "128": "icons/icon128.svg"
  }
},
"icons": {
  "16": "icons/icon16.svg",
  "48": "icons/icon48.svg",
  "128": "icons/icon128.svg"
}
```

注意：某些版本的Chrome可能不支持SVG图标，所以最好还是转换为PNG格式。 