import React, { useState } from 'react';
import { Delete, X, Space, Sparkles, Hash, Check } from 'lucide-react';

interface AfghanVirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertChar: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
}

type KeyboardTab = 'dari' | 'pashto' | 'numbers' | 'common_words';

export const AfghanVirtualKeyboard: React.FC<AfghanVirtualKeyboardProps> = ({
  isOpen,
  onClose,
  onInsertChar,
  onBackspace,
  onClear,
  onSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<KeyboardTab>('dari');

  if (!isOpen) return null;

  // Dari Layout Rows
  const dariRows = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ژ', 'آ', 'ء']
  ];

  // Pashto Specific letters + Standard Letters
  const pashtoSpecialRow = ['ټ', 'څ', 'ځ', 'ډ', 'ړ', 'ږ', 'ښ', 'ګ', 'ڼ', 'ۍ', 'ې', 'ئ', 'ي'];
  const pashtoRows = [
    pashtoSpecialRow,
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ژ', 'آ', 'ء']
  ];

  // Numbers & Punctuation
  const numberRows = [
    ['۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹', '۰'],
    ['،', '؛', '؟', '«', '»', '(', ')', '-', ':', '/', '#']
  ];

  // Common Afghan Civil Registry Words & Particles
  const commonWords = [
    'محمد', 'احمد', 'خان', 'گل', 'جان', 'عبدالله',
    'شاه', 'علی', 'ولد', 'بنت', 'حاجی', 'مولوی',
    'سید', 'میر', 'آغا', 'کابل', 'هرات', 'بلخ', 'کندهار'
  ];

  return (
    <div
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 sm:p-4 animate-fade-in transition-all select-none"
      dir="rtl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Keyboard Header & Tab Switcher */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200 dark:border-slate-800 gap-2 flex-wrap">
        <div className="flex items-center space-x-1 sm:space-x-1.5 space-x-reverse">
          <button
            type="button"
            onClick={() => setActiveTab('dari')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dari'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
            }`}
          >
            دری (Dari)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pashto')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pashto'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
            }`}
          >
            پښتو (Pashto)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('numbers')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'numbers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
            }`}
          >
            <Hash className="w-3 h-3" />
            <span>ارقام (Numbers)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('common_words')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'common_words'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>کلمات مروج</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 mr-auto">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden md:inline">
            کیبورد رسمی افغانستان
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="بستن کیبورد (Close)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Keys Container */}
      <div className="space-y-1.5 sm:space-y-2">
        {/* DARI LAYOUT */}
        {activeTab === 'dari' && (
          <div className="space-y-1.5 sm:space-y-2">
            {dariRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertChar(char)}
                    className="flex-1 max-w-[42px] h-9 sm:h-10 bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:active:bg-emerald-950/40 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-base font-bold shadow-xs active:scale-95 transition-all font-persian flex items-center justify-center cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* PASHTO LAYOUT */}
        {activeTab === 'pashto' && (
          <div className="space-y-1.5 sm:space-y-2">
            {/* Distinct Pashto Row Highlighted */}
            <div className="p-1.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30">
              <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 mb-1 px-1">
                تورو ځانګړتیاوې (Pashto Specific Characters):
              </div>
              <div className="flex justify-center gap-1 sm:gap-1.5 flex-wrap">
                {pashtoSpecialRow.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertChar(char)}
                    className="flex-1 min-w-[32px] max-w-[42px] h-9 sm:h-10 bg-amber-100/80 hover:bg-amber-200 active:bg-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:active:bg-amber-500/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/40 rounded-lg text-sm sm:text-base font-bold shadow-xs active:scale-95 transition-all font-persian flex items-center justify-center cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Alphabet Rows */}
            {pashtoRows.slice(1).map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertChar(char)}
                    className="flex-1 max-w-[42px] h-9 sm:h-10 bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:active:bg-emerald-950/40 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-sm sm:text-base font-bold shadow-xs active:scale-95 transition-all font-persian flex items-center justify-center cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* NUMBERS & PUNCTUATION */}
        {activeTab === 'numbers' && (
          <div className="space-y-2 py-1">
            {numberRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-2">
                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => onInsertChar(char)}
                    className="flex-1 max-w-[50px] h-10 bg-slate-50 hover:bg-slate-100 active:bg-emerald-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:active:bg-emerald-950/40 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-base font-bold shadow-xs active:scale-95 transition-all font-persian flex items-center justify-center cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* COMMON WORDS & PARTICLES */}
        {activeTab === 'common_words' && (
          <div className="py-1">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              کلمات و القاب پرکاربرد در اسناد نفوس (Click to insert):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {commonWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => onInsertChar(word + ' ')}
                  className="px-3 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 dark:bg-slate-800 dark:hover:bg-emerald-950/30 dark:text-slate-200 dark:hover:text-emerald-300 dark:border-slate-700 dark:hover:border-emerald-500/40 rounded-xl text-xs font-bold font-persian shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  +{word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTROL ROW (Space, ZWNJS, Backspace, Clear, Submit) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Clear Button */}
          <button
            type="button"
            onClick={onClear}
            className="px-3 h-9 sm:h-10 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-lg text-xs font-semibold active:scale-95 transition-all cursor-pointer shrink-0"
            title="پاکسازی کامل متن"
          >
            پاکسازی
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={onBackspace}
            className="px-3 h-9 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer shrink-0"
            title="حذف آخرین حرف (Backspace)"
          >
            <Delete className="w-4 h-4" />
            <span className="hidden sm:inline">حذف</span>
          </button>

          {/* Zero-Width Non-Joiner (نیم‌فاصله) */}
          <button
            type="button"
            onClick={() => onInsertChar('\u200c')}
            className="px-3 h-9 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold active:scale-95 transition-all cursor-pointer shrink-0 font-persian"
            title="نیم‌فاصله (ZWNJS)"
          >
            نیم‌فاصله
          </button>

          {/* Space Button */}
          <button
            type="button"
            onClick={() => onInsertChar(' ')}
            className="flex-1 h-9 sm:h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            title="فاصله (Space)"
          >
            <Space className="w-4 h-4" />
            <span>فاصله (Space)</span>
          </button>

          {/* Submit Search Button (If provided) */}
          {onSubmit && (
            <button
              type="button"
              onClick={onSubmit}
              className="px-4 h-9 sm:h-10 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
              title="اجرای جستجو (Submit Search)"
            >
              <Check className="w-3.5 h-3.5" />
              <span>جستجو</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
