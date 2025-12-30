import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-dark border border-surface-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border sticky top-0 bg-surface-dark z-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">info</span>
            關於 Retrace.tw
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-gray-300">
          
          {/* Intro */}
          <section>
            <h3 className="text-lg font-bold text-white mb-2">這是什麼工具？</h3>
            <p className="leading-relaxed">
              Retrace.tw 是一個針對台灣股市設計的量化回測工具。我們整合了歷史股價與除權息資料，
              協助投資人模擬在特定時間點投入資金後，經過市場波動與股息再投入（DRIP）後的資產變化，
              並與市場標竿（如 006208 富邦台50）進行績效比較。
            </p>
          </section>

          {/* Settings Guide */}
          <section>
            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-primary pl-3">參數設定說明</h3>
            
            <div className="grid gap-6">
              <div className="bg-background-dark p-4 rounded-lg border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">search</span>
                  <span className="font-bold text-white">股票代號</span>
                </div>
                <p className="text-sm">
                  輸入台股代號（如 <code className="text-primary">2330</code>）或名稱。系統支援上市、上櫃股票及 ETF。
                </p>
              </div>

              <div className="bg-background-dark p-4 rounded-lg border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  <span className="font-bold text-white">回測區間</span>
                </div>
                <p className="text-sm">
                  設定開始與結束日期。
                  <br />
                  <span className="text-yellow-500 text-xs">注意：結束日期必須是「昨天」以前，以確保有完整的收盤數據。</span>
                </p>
              </div>

              <div className="bg-background-dark p-4 rounded-lg border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">attach_money</span>
                  <span className="font-bold text-white">資金與成本</span>
                </div>
                <ul className="list-disc list-inside text-sm space-y-1 ml-1">
                  <li><strong>初始本金：</strong>模擬起點時投入的單筆資金。</li>
                  <li><strong>手續費折扣：</strong>券商提供的電子下單折扣（預設 6 折）。</li>
                  <li><strong>證交稅：</strong>賣出時是否扣除 0.3% 交易稅。</li>
                </ul>
              </div>

              <div className="bg-background-dark p-4 rounded-lg border border-surface-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">autorenew</span>
                  <span className="font-bold text-white">股息再投入 (DRIP)</span>
                </div>
                <p className="text-sm">
                  若勾選此選項，系統會在收到現金股利（扣除跨行匯費後）的當日，
                  以收盤價自動買入該股票的零股，最大化複利效應。
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-border bg-background-dark rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-[#1bc755] transition-colors"
          >
            了解，開始使用
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;