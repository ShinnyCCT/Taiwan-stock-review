import React, { useState, useEffect, useMemo } from 'react';
import { BacktestInput } from '../types';

interface InputFormProps {
  initialValues: BacktestInput;
  onSubmit: (data: BacktestInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ initialValues, onSubmit, isLoading }) => {
  // Local state initialized with props (for "remember settings" functionality)
  const [formData, setFormData] = useState<BacktestInput>(initialValues);
  
  // Sync state if initialValues change (e.g. parent reset)
  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  // Calculate yesterday's date string for max limitation
  const maxAllowedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Date Presets Helpers
  const setDateRange = (type: '1Y' | '3Y' | '5Y' | 'YTD') => {
    // End date is always set to yesterday for stability
    const endDateStr = maxAllowedDate;
    
    // Calculate start date relative to yesterday (the end date)
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() - 1);
    
    const startDateObj = new Date(endDateObj);

    switch (type) {
      case '1Y':
        startDateObj.setFullYear(endDateObj.getFullYear() - 1);
        break;
      case '3Y':
        startDateObj.setFullYear(endDateObj.getFullYear() - 3);
        break;
      case '5Y':
        startDateObj.setFullYear(endDateObj.getFullYear() - 5);
        break;
      case 'YTD':
        startDateObj.setMonth(0, 1); // Jan 1st of current year
        startDateObj.setFullYear(endDateObj.getFullYear());
        break;
    }
    const startDateStr = startDateObj.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      startDate: startDateStr,
      endDate: endDateStr
    }));
  };

  const handleReset = () => {
    setFormData({
      symbol: '',
      stockName: '',
      startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
      endDate: maxAllowedDate,
      investmentAmount: 100000,
      useDRIP: true,
      feeDiscount: 6.0,
      deductTax: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Styles
  const sectionTitleClass = "text-white text-lg font-bold flex items-center gap-2 mb-6";
  const labelClass = "block mb-3 text-sm font-medium text-gray-300";
  const inputClass = "w-full bg-background-dark/50 border border-surface-border text-white text-base rounded-lg focus:ring-primary focus:border-primary block p-3.5 placeholder-gray-600 transition-colors hover:border-gray-500";
  const dateBtnClass = (active: boolean) => 
    `px-5 py-2 text-sm rounded-full font-medium transition-all border ${
      active 
        ? 'bg-primary/20 text-primary border-primary' 
        : 'bg-surface-border/50 text-gray-400 border-transparent hover:bg-surface-border hover:text-white'
    }`;

  return (
    <div className="bg-surface-dark border border-surface-border rounded-xl p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* Section 1: Stock */}
        <div>
           <h3 className={sectionTitleClass}>
             <span className="material-symbols-outlined text-primary text-[24px]">search</span>
             標的設定
           </h3>
           <div className="grid grid-cols-1 gap-6">
             <div>
                <label className={labelClass}>股票代號 / 名稱</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 material-symbols-outlined text-[20px]">candlestick_chart</span>
                  <input
                    type="text"
                    required
                    placeholder="例如：2330 或 台積電"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    className={`${inputClass} pl-12`}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">支援台股上市櫃股票、ETF</p>
             </div>
           </div>
        </div>

        {/* Section 2: Date Range */}
        <div>
          <h3 className={sectionTitleClass}>
             <span className="material-symbols-outlined text-primary text-[24px]">calendar_month</span>
             回測區間
           </h3>
           
           <div className="flex flex-wrap gap-3 mb-6">
             <button type="button" onClick={() => setDateRange('1Y')} className={dateBtnClass(false)}>近一年</button>
             <button type="button" onClick={() => setDateRange('3Y')} className={dateBtnClass(false)}>近三年</button>
             <button type="button" onClick={() => setDateRange('5Y')} className={dateBtnClass(false)}>近五年</button>
             <button type="button" onClick={() => setDateRange('YTD')} className={dateBtnClass(false)}>今年至今 (YTD)</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>開始日期</label>
                <input
                  type="date"
                  required
                  max={formData.endDate}
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>結束日期</label>
                <input
                  type="date"
                  required
                  min={formData.startDate}
                  max={maxAllowedDate} // Restrict to yesterday
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className={inputClass}
                />
              </div>
           </div>
        </div>

        {/* Section 3: Money & Costs */}
        <div>
           <h3 className={sectionTitleClass}>
             <span className="material-symbols-outlined text-primary text-[24px]">attach_money</span>
             資金與成本
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
             <div>
                <label className={labelClass}>初始本金 (NT$)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 text-sm font-mono">$</span>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={formData.investmentAmount}
                    onChange={(e) => setFormData({...formData, investmentAmount: Number(e.target.value)})}
                    className={`${inputClass} pl-8`}
                  />
                </div>
             </div>

             <div>
               <label className={labelClass}>手續費折扣 (折)</label>
               <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={formData.feeDiscount}
                    onChange={(e) => setFormData({...formData, feeDiscount: Number(e.target.value)})}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 text-sm">折</span>
               </div>
             </div>

             {/* Advanced Options Group */}
             <div className="md:col-span-2 mt-2">
               <label className={labelClass}>進階選項</label>
               <div className="flex flex-col gap-4">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.useDRIP}
                        onChange={(e) => setFormData({...formData, useDRIP: e.target.checked})}
                        className="peer h-6 w-6 cursor-pointer appearance-none rounded border border-gray-600 bg-background-dark transition-all checked:border-primary checked:bg-primary"
                      />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[18px] pointer-events-none">check</span>
                    </div>
                    <span className="text-base text-gray-200 group-hover:text-white transition-colors">包含現金股利再投入 (DRIP)</span>
                 </label>

                 <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData.deductTax}
                        onChange={(e) => setFormData({...formData, deductTax: e.target.checked})}
                        className="peer h-6 w-6 cursor-pointer appearance-none rounded border border-gray-600 bg-background-dark transition-all checked:border-primary checked:bg-primary"
                      />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[18px] pointer-events-none">check</span>
                    </div>
                    <span className="text-base text-gray-200 group-hover:text-white transition-colors">扣除證交稅 (0.3%)</span>
                 </label>
               </div>
             </div>
           </div>
        </div>

        <hr className="border-surface-border" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-5">
           <button
             type="button"
             onClick={handleReset}
             className="px-6 py-3.5 rounded-lg border border-surface-border text-gray-400 font-bold text-base hover:bg-surface-border hover:text-white transition-colors"
           >
             重置設定
           </button>
           
           <button
            type="submit"
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 py-3.5 px-10 rounded-lg text-background-dark font-bold text-base shadow-[0_0_20px_rgba(32,223,96,0.2)] transition-all ${
              isLoading 
                ? 'bg-gray-600 cursor-not-allowed opacity-70' 
                : 'bg-primary hover:bg-[#1bc755] hover:shadow-[0_0_25px_rgba(32,223,96,0.4)] transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? '運算中...' : '開始回測'}
            {!isLoading && <span className="material-symbols-outlined text-[24px]">play_arrow</span>}
          </button>
        </div>

      </form>
    </div>
  );
};

export default InputForm;