/**
 * 抽籤分組助手 - App Logic
 * 使用單例對象封裝邏輯，避免全域變數污染
 */
const app = {
    state: {
        originalList: [],     // 原始過濾後的名單
        drawPool: [],         // 抽籤池（若不重複抽取則會遞減）
        drawResults: [],      // 已抽出的結果
        groups: [],           // 分組結果
        isRolling: false      // 是否正在動畫中
    },

    init() {
        // 從 localStorage 恢復
        const savedData = localStorage.getItem('drawAssistantState');
        if (savedData) {
            const data = JSON.parse(savedData);
            document.getElementById('nameInput').value = data.inputText || '';
            this.state.drawResults = data.drawResults || [];
            this.state.groups = data.groups || [];
            this.handleInputChange();
            this.renderDrawResults();
            this.renderGroups();
        }

        // 監聽輸入框
        document.getElementById('nameInput').addEventListener('input', () => this.handleInputChange());
    },

    /**
     * 1. 名單處理邏輯
     */
    handleInputChange() {
        const text = document.getElementById('nameInput').value;
        const names = text.split('\n')
            .map(n => n.trim())
            .filter(n => n !== '');

        this.state.originalList = names;

        // 偵測重複
        const counts = {};
        names.forEach(n => counts[n] = (counts[n] || 0) + 1);
        const hasDuplicates = Object.values(counts).some(c => c > 1);

        this.renderPreview(counts);
        this.updateStats();
        this.saveToStorage();

        // 若名單改變，重置抽籤池為原始名單（不影響已顯示的結果，但會影響後續抽取）
        // 注意：這裡只在長度發生變化或關鍵變動時才重置 pool，以保持操作連貫性
        this.state.drawPool = [...names];

        const btn = document.getElementById('removeDupBtn');
        hasDuplicates ? btn.classList.remove('hide') : btn.classList.add('hide');
    },

    renderPreview(counts) {
        const preview = document.getElementById('listPreview');
        if (this.state.originalList.length === 0) {
            preview.innerHTML = '<div style="color: #94a3b8; text-align: center; margin-top: 20px;">尚無資料</div>';
            return;
        }

        preview.innerHTML = this.state.originalList.map((name, idx) => `
        <div class="list-item">
            <span>${idx + 1}. ${name}</span>
            ${counts[name] > 1 ? '<span class="badge-duplicate">重複</span>' : ''}
        </div>
    `).join('');
    },

    updateStats() {
        document.getElementById('totalCount').innerText = `共 ${this.state.originalList.length} 人`;
        // 更新抽籤池剩餘人數
        const pool = this.getAdjustedPool();
        document.getElementById('remainingDraw').innerText = `剩餘 ${pool.length} 人`;
    },

    getAdjustedPool() {
        const allowRepeat = document.getElementById('allowRepeat').checked;
        if (allowRepeat) return this.state.originalList;

        // 如果不允許重複，過濾掉已經抽出來的人
        return this.state.originalList.filter(n => !this.state.drawResults.includes(n));
    },

    removeDuplicates() {
        const unique = [...new Set(this.state.originalList)];
        document.getElementById('nameInput').value = unique.join('\n');
        this.handleInputChange();
    },

    importMock() {
        const mocks = ["王小明", "李曉華", "張大千", "林志玲", "周杰倫", "蔡依林", "陳奕迅", "張學友", "劉德華", "郭富城", "金城武", "林青霞", "王祖賢", "鍾楚紅", "關之琳"];
        document.getElementById('nameInput').value = mocks.join('\n');
        this.handleInputChange();
    },

    resetList() {
        this.openModal('clearConfirmModal');
    },

    confirmClearList() {
        document.getElementById('nameInput').value = '';
        this.state.drawResults = [];
        this.state.groups = [];
        this.handleInputChange();
        this.renderDrawResults();
        this.renderGroups();
        this.closeModal('clearConfirmModal');
    },

    openModal(id) {
        document.getElementById(id).classList.add('active');
    },

    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },

    /**
     * 2. 名單抽籤邏輯
     */
    startDraw() {
        if (this.state.isRolling) return;

        const count = parseInt(document.getElementById('drawCount').value) || 1;
        const pool = this.getAdjustedPool();

        if (pool.length === 0) {
            alert('名單已空或所有人都已抽過！');
            return;
        }
        if (pool.length < count) {
            alert(`剩餘人數 (${pool.length}) 不足抽取人數 (${count})`);
            return;
        }

        this.state.isRolling = true;
        const slot = document.getElementById('slotMachine');

        // 隨機選出結果
        const winners = this.shuffle([...pool]).slice(0, count);

        // 滾動動畫邏輯
        let duration = 2000;
        let startTime = null;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            if (progress < duration) {
                const tempRandom = pool[Math.floor(Math.random() * pool.length)];
                slot.innerText = tempRandom;
                requestAnimationFrame(animate);
            } else {
                // 動畫結束
                slot.innerText = winners.length === 1 ? `🎉 ${winners[0]}` : `🎉 抽出 ${winners.length} 人`;
                this.state.drawResults = [...this.state.drawResults, ...winners];
                this.state.isRolling = false;
                this.renderDrawResults();
                this.updateStats();
                this.saveToStorage();
            }
        };

        requestAnimationFrame(animate);
    },

    renderDrawResults() {
        const container = document.getElementById('drawResults');
        container.innerHTML = this.state.drawResults.map(name => `
        <div class="winner-tag">${name}</div>
    `).join('');
    },

    resetDrawResults() {
        if (this.state.drawResults.length === 0) return;
        this.openModal('resetDrawModal');
    },

    confirmResetDraw() {
        this.state.drawResults = [];
        this.renderDrawResults();
        this.updateStats();
        this.saveToStorage();
        document.getElementById('slotMachine').innerText = '準備開始...';
        this.closeModal('resetDrawModal');
    },

    /**
     * 3. 自動分組邏輯
     */
    startGrouping() {
        if (this.state.originalList.length === 0) {
            alert('請先輸入名單！');
            return;
        }

        const size = parseInt(document.getElementById('groupSize').value) || 2;
        const shuffled = this.shuffle([...this.state.originalList]);
        const groups = [];

        for (let i = 0; i < shuffled.length; i += size) {
            groups.push(shuffled.slice(i, i + size));
        }

        this.state.groups = groups;
        this.renderGroups();
        this.saveToStorage();
    },

    renderGroups() {
        const container = document.getElementById('groupResults');
        if (this.state.groups.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.state.groups.map((members, idx) => `
        <div class="group-card">
            <div class="group-header">
                <span>第 ${idx + 1} 組</span>
                <span>${members.length} 人</span>
            </div>
            <div class="group-body">
                ${members.map(m => `<div class="group-member">${m}</div>`).join('')}
            </div>
        </div>
    `).join('');
    },

    resetGroups() {
        if (this.state.groups.length === 0) return;
        this.openModal('resetGroupsModal');
    },

    confirmResetGroups() {
        this.state.groups = [];
        this.renderGroups();
        this.saveToStorage();
        this.closeModal('resetGroupsModal');
    },

    exportCSV() {
        if (this.state.groups.length === 0) {
            alert('請先進行分組！');
            return;
        }

        let csvContent = "\ufeff組別,姓名\n"; // 加入 BOM 解決 Excel 繁體亂碼
        this.state.groups.forEach((group, idx) => {
            group.forEach(name => {
                csvContent += `第 ${idx + 1} 組,${name}\n`;
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `分組結果_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * 輔助工具
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    saveToStorage() {
        const data = {
            inputText: document.getElementById('nameInput').value,
            drawResults: this.state.drawResults,
            groups: this.state.groups
        };
        localStorage.setItem('drawAssistantState', JSON.stringify(data));
    }
};

// 啟動應用程式
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
