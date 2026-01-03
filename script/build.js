const fs = require('fs');
const path = require('path');

// 检查是否安装了依赖
let JavaScriptObfuscator;
try {
    JavaScriptObfuscator = require('javascript-obfuscator');
} catch (e) {
    console.error('❌ 错误: 未找到 javascript-obfuscator 模块。');
    console.error('请运行: pnpm install (或 npm install)');
    process.exit(1);
}

const sourcePath = path.join(__dirname, 'god-of-steam.dev.js');
const distPath = path.join(__dirname, 'god-of-steam.js');

console.log('🔄 正在读取源码:', sourcePath);
const source = fs.readFileSync(sourcePath, 'utf8');

// 1. 提取 UserScript 元数据 (Metadata Block)
// 混淆器会破坏注释，必须先提取出来，最后再拼回去
const metadataMatch = source.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!metadataMatch) {
    console.error('❌ 错误: 未找到 UserScript 元数据块！');
    process.exit(1);
}
const metadata = metadataMatch[0];

// 2. 移除元数据后的纯代码
const code = source.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, '');

console.log('🛡️  正在进行深度混淆 (方案 2+3: 控制流平坦化 + 字符串加密)...');

// 3. 混淆配置
const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true, // 压缩代码
    
    // --- 方案二: 控制流平坦化 ---
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1, // 100% 的概率对函数应用平坦化
    
    // --- 方案三: 字符串加密与旋转 ---
    stringArray: true,
    stringArrayEncoding: ['rc4'], // 使用 RC4 算法加密字符串
    stringArrayThreshold: 1,      // 100% 的字符串都被提取
    stringArrayRotate: true,      // 随机旋转数组
    stringArrayShuffle: true,     // 随机打乱数组
    
    // --- 其他增强 ---
    splitStrings: true,           // 将长字符串拆分 (e.g. "steam" -> "st" + "eam")
    splitStringsChunkLength: 5,
    
    // 防调试 (可选，为了开发方便暂时注释，发布时可开启)
    // debugProtection: true,
    // debugProtectionInterval: 4000,
    
    // 自身完整性检查 (防篡改)
    // selfDefending: true,

    // 标识符混淆
    identifierNamesGenerator: 'hexadecimal', // 变量名变成 _0x1a2b 这种
    renameGlobals: false, // 不重命名全局变量 (防止破坏油猴 API 或 window 对象)
});

// 4. 拼接最终结果
const finalOutput = `${metadata}\n\n${obfuscationResult.getObfuscatedCode()}`;

// 5. 写入文件
fs.writeFileSync(distPath, finalOutput);

console.log('✅ 构建完成!');
console.log('📄 输出文件:', distPath);
console.log('📏 原始大小:', source.length, 'bytes');
console.log('📏 混淆大小:', finalOutput.length, 'bytes');
