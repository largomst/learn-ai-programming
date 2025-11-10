# 吵架包赢 - AI吵架回复生成器

一个基于DeepSeek API的智能吵架回复生成器，帮助用户在对话中生成有力的回复内容。

## 功能特性

- 🤖 **AI驱动**: 使用DeepSeek的deepseek-chat模型生成高质量回复
- 🎚️ **语气强度调节**: 10级滑块控制，从轻微到极度强烈
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🎨 **微信风格UI**: 采用微信绿色主题，界面清新简洁
- 💾 **本地存储**: 自动保存输入内容，恢复时数据不丢失
- 🔄 **一键复制**: 快速复制生成的回复内容
- ⚡ **智能缓存**: 避免重复请求，提升响应速度
- 🛡️ **错误处理**: 完善的错误提示和网络异常处理

## 技术栈

- **前端框架**: Next.js 15 + React 19
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS
- **AI服务**: DeepSeek API (deepseek-chat)
- **数据存储**: localStorage

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装和运行

1. 克隆项目并进入目录
```bash
cd ArgueWin
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
在项目根目录创建 `.env.local` 文件：
```env
API_BASE_URL=https://api.deepseek.com/v1/chat/completions
API_KEY=你的DeepSeek_API_Key
```

4. 启动开发服务器
```bash
npm run dev
```

5. 访问应用
打开 [http://localhost:3000](http://localhost:3000) 即可使用

### 构建生产版本

```bash
npm run build
npm start
```

## 使用说明

1. **输入对方的话**: 在文本框中输入你想要回复的对话内容
2. **选择语气强度**: 拖动滑块选择合适的语气强度（1-10级）
3. **生成回复**: 点击"开始吵架"按钮，AI将生成3条回复建议
4. **复制使用**: 点击复制按钮快速复制喜欢的回复内容

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx          # 主页组件
│   └── globals.css       # 全局样式
├── components/            # React组件
│   ├── InputForm.tsx     # 输入表单组件
│   ├── ResultsDisplay.tsx # 结果展示组件
│   ├── LoadingSpinner.tsx # 加载动画组件
│   └── CopyButton.tsx    # 复制按钮组件
└── lib/                  # 工具库
    ├── config.ts         # 配置管理
    ├── deepseek.ts       # DeepSeek API服务
    └── types.ts          # TypeScript类型定义
```

## 设计理念

- **用户体验优先**: 简洁直观的界面设计，操作流程清晰
- **移动端友好**: 响应式布局，确保在各种设备上都有良好体验
- **智能化生成**: AI根据语气强度生成符合需求的回复内容
- **隐私保护**: 所有数据仅存储在用户本地，不上传服务器

## 开发说明

### 主要组件

- **InputForm**: 处理用户输入，包括文本和多级滑块
- **ResultsDisplay**: 展示生成的回复内容，支持一键复制
- **DeepSeekService**: 封装API调用，包含缓存和错误处理逻辑
- **ConfigService**: 管理环境变量和配置验证

### 特色功能

1. **智能缓存**: 相同输入的请求会从缓存返回，避免重复调用
2. **请求限流**: 防止API调用过于频繁
3. **多级错误处理**: 区分网络错误、API错误和数据格式错误
4. **本地数据持久化**: 表单数据和历史记录自动保存

## 注意事项

- 请确保DeepSeek API Key有效且有足够的使用额度
- 应用依赖网络连接，API调用失败时会显示相应错误提示
- 生成的回复内容仅供参考，请理性使用

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License

---

由 DeepSeek AI 驱动 🤖