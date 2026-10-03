import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

export const toEnglishDigits = (str: string | number | null | undefined): string => {
  if (str === null || str === undefined) return '';
  return str.toString()
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
};

export const toPersianDigits = (str: string | number | null | undefined): string => {
  if (str === null || str === undefined) return '';
  return str.toString()
    .replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)])
    .replace(/[٠-٩]/g, d => '۰۱۲۳۴۵۶۷۸۹'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
};

export const getTodayShamsi = (): string => {
  try {
    const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value || '1405';
    const m = parts.find(p => p.type === 'month')?.value.padStart(2, '0') || '07';
    const d = parts.find(p => p.type === 'day')?.value.padStart(2, '0') || '11';
    return `${y}/${m}/${d}`;
  } catch {
    return '1405/07/11';
  }
};

export const getOffsetShamsiDate = (days: number): string => {
  try {
    const dt = new Date();
    dt.setDate(dt.getDate() + days);
    const parts = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(dt);
    const y = parts.find(p => p.type === 'year')?.value || '1405';
    const m = parts.find(p => p.type === 'month')?.value.padStart(2, '0') || '07';
    const d = parts.find(p => p.type === 'day')?.value.padStart(2, '0') || '11';
    return `${y}/${m}/${d}`;
  } catch {
    return '1405/07/11';
  }
};

export interface ShamsiDatePreset {
  label: string;
  daysOffset: number;
}

interface ShamsiDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  presets?: ShamsiDatePreset[];
  accentColor?: 'emerald' | 'amber' | 'indigo' | 'blue';
}

const PERSIAN_MONTHS = [
  { num: '01', name: 'فروردین' },
  { num: '02', name: 'اردیبهشت' },
  { num: '03', name: 'خرداد' },
  { num: '04', name: 'تیر' },
  { num: '05', name: 'مرداد' },
  { num: '06', name: 'شهریور' },
  { num: '07', name: 'مهر' },
  { num: '08', name: 'آبان' },
  { num: '09', name: 'آذر' },
  { num: '10', name: 'دی' },
  { num: '11', name: 'بهمن' },
  { num: '12', name: 'اسفند' }
];

const YEARS = ['1403', '1404', '1405', '1406', '1407'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export const ShamsiDatePicker: React.FC<ShamsiDatePickerProps> = ({
  value,
  onChange,
  label,
  required,
  presets,
  accentColor = 'emerald'
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Normalize current date
  const cleanEngVal = toEnglishDigits(value || getTodayShamsi());
  const parts = cleanEngVal.split('/');
  const curYear = parts[0] || '1405';
  const curMonth = (parts[1] || '07').padStart(2, '0');
  const curDay = (parts[2] || '11').padStart(2, '0');

  // Handle typing inside input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = toEnglishDigits(e.target.value).replace(/[^0-9/]/g, '');
    
    // Auto-insert slashes if typed continuously e.g. 14050711
    const digitsOnly = raw.replace(/\//g, '');
    if (digitsOnly.length > 4 && !raw.includes('/')) {
      raw = digitsOnly.slice(0, 4) + '/' + digitsOnly.slice(4);
    }
    if (digitsOnly.length > 6 && raw.indexOf('/') === 4 && raw.lastIndexOf('/') === 4) {
      raw = raw.slice(0, 7) + '/' + raw.slice(7);
    }
    
    onChange(raw);
  };

  const updateParts = (y: string, m: string, d: string) => {
    onChange(`${y}/${m}/${d}`);
  };

  const ringFocus = accentColor === 'emerald'
    ? 'focus:ring-emerald-500 focus:border-emerald-500'
    : accentColor === 'amber'
    ? 'focus:ring-amber-500 focus:border-amber-500'
    : accentColor === 'indigo'
    ? 'focus:ring-indigo-500 focus:border-indigo-500'
    : 'focus:ring-blue-500 focus:border-blue-500';

  const badgeActive = accentColor === 'emerald'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
    : accentColor === 'amber'
    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
    : accentColor === 'indigo'
    ? 'bg-indigo-50 text-indigo-900 border-indigo-300 hover:bg-indigo-100'
    : 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100';

  return (
    <div className="space-y-1.5 text-right">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-black text-slate-800">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
          >
            <Calendar className="w-3 h-3" />
            <span>{showPicker ? 'بستن تقویم' : 'انتخاب از تقویم'}</span>
          </button>
        </div>
      )}

      {/* Main Input Row */}
      <div className="relative flex items-center">
        <input
          type="text"
          dir="ltr"
          required={required}
          value={toPersianDigits(value)}
          onChange={handleInputChange}
          placeholder="۱۴۰۵/۰۷/۱۱"
          className={`w-full py-2.5 px-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:ring-2 ${ringFocus} transition shadow-sm`}
        />

        {/* Calendar toggle button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="absolute left-2 top-2 p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          title="باز کردن تقویم و انتخاب روز/ماه/سال"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Shamsi Picker Panel */}
      {showPicker && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-lg space-y-2 animate-in fade-in duration-150 text-right">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-2">
            <span>انتخاب تاریخ شمسی:</span>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-xs text-emerald-600 hover:underline font-black cursor-pointer"
            >
              تأیید و بستن
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2" dir="rtl">
            {/* Day */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">روز</label>
              <select
                value={curDay}
                onChange={(e) => updateParts(curYear, curMonth, e.target.value)}
                className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none"
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>
                    {toPersianDigits(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">ماه</label>
              <select
                value={curMonth}
                onChange={(e) => updateParts(curYear, e.target.value, curDay)}
                className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none"
              >
                {PERSIAN_MONTHS.map(m => (
                  <option key={m.num} value={m.num}>
                    {m.name} ({toPersianDigits(m.num)})
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">سال</label>
              <select
                value={curYear}
                onChange={(e) => updateParts(e.target.value, curMonth, curDay)}
                className="w-full p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Presets Buttons (One-Click) */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((preset, idx) => {
            const targetDate = getOffsetShamsiDate(preset.daysOffset);
            const isSelected = cleanEngVal === targetDate;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(targetDate)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                  isSelected ? badgeActive : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
