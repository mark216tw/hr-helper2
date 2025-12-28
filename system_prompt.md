# System Prompt - 抽籤分組助手

## 專案概述
這是一個純前端的 Web 應用程式，專為名單管理、隨機抽籤與自動分組設計。應用程式採用分離式架構（HTML/CSS/JS），無需後端伺服器，可直接在瀏覽器中運行。

## 核心功能

### 1. 名單管理系統
- **輸入處理**：接受多行文本輸入，每行一個姓名
- **資料清理**：自動去除空白行與前後空格
- **重複偵測**：即時偵測並標記重複姓名
- **重複移除**：提供一鍵移除重複姓名功能
- **模擬資料**：內建 15 個中文姓名作為測試資料
- **清空功能**：使用自定義 Modal 彈窗確認清空操作，避免誤觸

### 2. 隨機抽籤功能
- **可配置抽取數量**：使用者可設定每次抽取人數
- **重複抽取選項**：
  - 允許重複：同一人可被多次抽中
  - 不允許重複：已抽中者從池中移除
- **動畫效果**：2 秒老虎機式滾動動畫
- **即時統計**：顯示剩餘可抽取人數
- **結果展示**：以標籤形式展示所有已抽中者
- **重置功能**：可清除抽籤結果重新開始

### 3. 自動分組功能
- **靈活分組**：根據設定的每組人數自動分組
- **隨機打散**：使用 Fisher-Yates 洗牌演算法確保隨機性
- **視覺化呈現**：以卡片形式展示各組成員
- **CSV 匯出**：支援下載分組結果為 CSV 檔案（含 UTF-8 BOM）
- **重新分組**：可重新隨機分配組別

## 技術架構

### 檔案結構
```
hr-helper2/
├── index.html      # 主要 HTML 結構
├── style.css       # 所有樣式定義
├── script.js       # 應用程式邏輯
├── README.md       # 專案說明文件
├── system_prompt.md # 系統提示文件（本檔案）
└── user_prompt.md  # 使用者提示文件
```

### 技術棧
- **HTML5**：語義化標籤、無障礙設計
- **CSS3**：
  - CSS 變數系統（色彩、間距、陰影）
  - Flexbox 與 Grid 佈局
  - 動畫效果（bounceIn、rolling、fade）
  - 響應式設計（768px 斷點）
- **JavaScript (ES6+)**：
  - 單例模式封裝應用邏輯
  - localStorage 持久化儲存
  - 事件驅動架構
  - Fisher-Yates 洗牌演算法

### 設計系統

#### 色彩變數
```css
--primary-color: #4f46e5      /* 主色調（靛藍） */
--primary-hover: #4338ca      /* 主色調懸停 */
--secondary-color: #64748b    /* 次要色調 */
--bg-color: #f8fafc           /* 背景色 */
--card-bg: #ffffff            /* 卡片背景 */
--text-main: #1e293b          /* 主要文字 */
--text-muted: #64748b         /* 次要文字 */
--danger-color: #ef4444       /* 危險操作色 */
--success-color: #22c55e      /* 成功操作色 */
```

#### 按鈕樣式
- `btn-primary`：主要操作（開始抽籤、即刻分組）
- `btn-outline`：次要操作（模擬名單、重新抽籤）
- `btn-danger`：危險操作（清空名單）
- `btn-success`：成功操作（移除重複）

## 狀態管理

### App State 結構
```javascript
state: {
    originalList: [],    // 原始名單陣列
    drawPool: [],        // 抽籤池（動態更新）
    drawResults: [],     // 已抽出的結果
    groups: [],          // 分組結果（二維陣列）
    isRolling: false     // 動畫進行中標記
}
```

### LocalStorage 資料結構
```javascript
{
    inputText: string,      // 原始輸入文本
    drawResults: string[],  // 抽籤結果陣列
    groups: string[][]      // 分組結果二維陣列
}
```

## UI/UX 設計原則

### 佈局
- **左側欄**（350px）：名單輸入與預覽
- **右側主區**：功能操作區（抽籤、分組）
- **響應式**：768px 以下切換為單欄佈局

### 互動反饋
- **即時預覽**：輸入時即時更新名單預覽
- **視覺提示**：重複姓名標記、剩餘人數統計
- **動畫效果**：抽籤滾動、結果彈入
- **確認對話框**：重要操作使用自定義 Modal 確認

### 無障礙設計
- 語義化 HTML 標籤
- 適當的 label 與 input 關聯
- 鍵盤可操作性
- 清晰的視覺層級

## 核心演算法

### Fisher-Yates 洗牌
```javascript
shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
```

### 重複偵測
使用物件計數法，時間複雜度 O(n)：
```javascript
const counts = {};
names.forEach(n => counts[n] = (counts[n] || 0) + 1);
const hasDuplicates = Object.values(counts).some(c => c > 1);
```

## 開發指南

### 新增功能時的考量
1. **狀態管理**：是否需要更新 `app.state`？
2. **持久化**：是否需要儲存到 localStorage？
3. **UI 更新**：是否需要新增渲染函式？
4. **驗證**：是否需要輸入驗證與錯誤處理？
5. **響應式**：是否需要考慮行動裝置顯示？

### 程式碼風格
- 使用 ES6+ 語法（箭頭函式、解構、展開運算子）
- 函式命名：動詞開頭（handle、render、update、reset）
- 註解：使用 JSDoc 風格的區塊註解
- 縮排：4 空格

### 測試建議
- 測試空名單情況
- 測試大量名單（100+ 人）
- 測試重複姓名處理
- 測試 localStorage 持久化
- 測試響應式佈局

## 未來擴展方向
- 匯入 CSV/Excel 檔案
- 自定義抽籤動畫時長
- 分組結果列印功能
- 歷史記錄功能
- 多語言支援
- 深色模式
- 更多 Modal 應用（重新抽籤、重新分組確認）
