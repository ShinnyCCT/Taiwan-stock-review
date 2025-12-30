# Retrace.tw - 台股回測系統

Taiwan Stock Backtester - 台灣股票回測工具

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Deployment**: Vercel

## 本地開發

### Prerequisites

- Node.js 18+
- npm 或 yarn

### 安裝與啟動

```bash
# 安裝套件
npm install

# 設定環境變數
# 複製 .env.local 並設定你的 GEMINI_API_KEY

# 啟動開發伺服器
npm run dev
```

開發伺服器會在 http://localhost:3000 啟動

### 其他指令

```bash
# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

## 部署到 Vercel

### 方法一：透過 Vercel Dashboard

1. 前往 [vercel.com](https://vercel.com) 並登入
2. 點選 **Add New… → Project**
3. 連結你的 GitHub repo
4. Framework Preset 選擇 **Vite**
5. 設定環境變數：
   - `GEMINI_API_KEY`: 你的 Gemini API Key
6. 點選 **Deploy**

### 方法二：透過 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署（會引導你完成設定）
vercel

# 部署到生產環境
vercel --prod
```

### 環境變數設定

在 Vercel Dashboard 的 **Settings → Environment Variables** 加入：

| 變數名稱 | 說明 |
|---------|------|
| `GEMINI_API_KEY` | Google Gemini API Key |

## 專案結構

```
├── index.html          # 進入點
├── index.tsx           # React 進入點
├── App.tsx             # 主要 App 元件
├── index.css           # 全域樣式
├── types.ts            # TypeScript 型別定義
├── components/         # React 元件
├── services/           # API 服務
├── vite.config.ts      # Vite 設定
├── tailwind.config.js  # Tailwind 設定
├── tsconfig.json       # TypeScript 設定
├── vercel.json         # Vercel 部署設定
└── .env.local          # 環境變數（勿上傳）
```

## License

Private
