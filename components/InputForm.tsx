import React, { useState, useEffect, useMemo } from 'react';
import { BacktestInput } from '../types';

interface InputFormProps {
  initialValues: BacktestInput;
  onSubmit: (data: BacktestInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ initialValues, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<BacktestInput>(initialValues);

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const maxAllowedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const setDateRange = (type: '1Y' | '3Y' | '5Y' | 'YTD') => {
    const endDateStr = maxAllowedDate;
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() - 1);
    const startDateObj = new Date(endDateObj);

    switch (type) {
      case '1Y': startDateObj.setFullYear(endDateObj.getFullYear() - 1); break;
      case '3Y': startDateObj.setFullYear(endDateObj.getFullYear() - 3); break;
      case '5Y': startDateObj.setFullYear(endDateObj.getFullYear() - 5); break;
      case 'YTD':
        startDateObj.setMonth(0, 1);
        startDateObj.setFullYear(endDateObj.getFullYear());
        break;
    }
    setFormData(prev => ({ ...prev, startDate: startDateObj.toISOString().split('T')[0], endDate: endDateStr }));
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

  // Compact Styles
  const sectionTitleClass = "text-white text-base font-bold flex items-center gap-2 mb-3";
  const labelClass = "block mb-1.5 text-xs font-medium text-gray-300";
  const inputClass = "w-full bg-background-dark/50 border border-surface-border text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 placeholder-gray-600 transition-colors hover:border-gray-500";
  const dateBtnClass = (active: boolean) =>
    `px-3 py-1.5 text-xs rounded-full font-medium transition-all border ${active
      ? 'bg-primary/20 text-primary border-primary'
      : 'bg-surface-border/50 text-gray-400 border-transparent hover:bg-surface-border hover:text-white'
    }`;

  return (
    <div className="bg-surface-dark border border-surface-border rounded-xl p-5 shadow-sm">
      <form onSubmit={handleSubmit}>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-6">

          {/* Left Column: Stock & Date (Col Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-5">

            {/* Stock Section */}
            <div>
              <h3 className={sectionTitleClass}>
                <span className="material-symbols-outlined text-primary text-[20px]">search</span>
                標的設定
              </h3>
              <div>
                <label className={labelClass}>股票代號 / 名稱</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 material-symbols-outlined text-[18px]">candlestick_chart</span>
                  <input
                    type="text"
                    required
                    placeholder="例如：2330 或 台積電"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>

            {/* Date Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${sectionTitleClass} !mb-0`}>
                  <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                  回測區間
                </h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDateRange('1Y')} className={dateBtnClass(false)}>近一年</button>
                  <button type="button" onClick={() => setDateRange('3Y')} className={dateBtnClass(false)}>近三年</button>
                  <button type="button" onClick={() => setDateRange('5Y')} className={dateBtnClass(false)}>近五年</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>開始日期</label>
                  <input
                    type="date"
                    required
                    max={formData.endDate}
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>結束日期</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate}
                    max={maxAllowedDate}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Money & Options (Col Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-5">

            {/* Money Section */}
            <div>
              <h3 className={sectionTitleClass}>
                <span className="material-symbols-outlined text-primary text-[20px]">attach_money</span>
                資金與成本
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>初始本金</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs font-mono">$</span>
                    <input
                      type="number"
                      min="1000"
                      required
                      value={formData.investmentAmount}
                      onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                      className={`${inputClass} pl-6`}
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className={labelClass}>手續費 (折)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={formData.feeDiscount}
                      onChange={(e) => setFormData({ ...formData, feeDiscount: Number(e.target.value) })}
                      className={`${inputClass} pr-8`}
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-xs">折</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-surface-border/20 p-4 rounded-lg space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.useDRIP}
                    onChange={(e) => setFormData({ ...formData, useDRIP: e.target.checked })}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-background-dark transition-all checked:border-primary checked:bg-primary"
                  />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[14px] pointer-events-none">check</span>
                </div>
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors">現金股利再投入 (DRIP)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.deductTax}
                    onChange={(e) => setFormData({ ...formData, deductTax: e.target.checked })}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-background-dark transition-all checked:border-primary checked:bg-primary"
                  />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-background-dark opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[14px] pointer-events-none">check</span>
                </div>
                <span className="text-sm text-gray-200 group-hover:text-white transition-colors">扣除證交稅 (0.3%)</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-auto pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-lg border border-surface-border text-gray-400 font-bold text-sm hover:bg-surface-border hover:text-white transition-colors"
              >
                重置
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-lg text-background-dark font-bold text-sm shadow-[0_0_15px_rgba(32,223,96,0.2)] transition-all ${isLoading
                  ? 'bg-gray-600 cursor-not-allowed opacity-70'
                  : 'bg-primary hover:bg-[#1bc755] hover:shadow-[0_0_20px_rgba(32,223,96,0.4)] transform hover:-translate-y-0.5'
                  }`}
              >
                {isLoading ? '運算中...' : '開始回測'}
                {!isLoading && <span className="material-symbols-outlined text-[20px]">play_arrow</span>}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default InputForm;