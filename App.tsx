import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Calculator } from 'lucide-react';

export default function App() {
  const [currentOperand, setCurrentOperand] = useState<string>('');
  const [previousOperand, setPreviousOperand] = useState<string>('');
  const [operation, setOperation] = useState<string | undefined>(undefined);
  const [overwrite, setOverwrite] = useState<boolean>(false);

  // 格式化數字 (加入千分位逗號)
  const formatOperand = (operand: string | undefined) => {
    if (operand == null || operand === '') return undefined;
    const [integer, decimal] = operand.split('.');
    if (decimal == null) {
      return new Intl.NumberFormat('en-US').format(parseFloat(integer));
    }
    return `${new Intl.NumberFormat('en-US').format(parseFloat(integer))}.${decimal}`;
  };

  // 清除所有
  const clear = useCallback(() => {
    setCurrentOperand('');
    setPreviousOperand('');
    setOperation(undefined);
    setOverwrite(false);
  }, []);

  // 刪除最後一位
  const deleteNumber = useCallback(() => {
    if (overwrite) {
      setCurrentOperand('');
      setOverwrite(false);
      return;
    }
    if (currentOperand === '') return;
    setCurrentOperand(currentOperand.slice(0, -1));
  }, [overwrite, currentOperand]);

  // 加入數字
  const appendNumber = useCallback((number: string) => {
    if (number === '.' && currentOperand.includes('.')) return;
    
    if (overwrite) {
      setCurrentOperand(number);
      setOverwrite(false);
    } else {
      // 防止開頭多個0
      if (number === '0' && currentOperand === '0') return;
      // 如果目前是空且輸入小數點，自動補0
      if (number === '.' && currentOperand === '') {
         setCurrentOperand('0.');
         return;
      }
      setCurrentOperand((prev) => prev + number);
    }
  }, [currentOperand, overwrite]);

  // 執行計算
  const compute = useCallback(() => {
    let computation: number;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    
    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '*':
        computation = prev * current;
        break;
      case '÷':
      case '/':
        computation = prev / current;
        break;
      default:
        return;
    }

    // 處理浮點數精度問題簡單解法
    computation = Math.round(computation * 100000000) / 100000000;

    setCurrentOperand(computation.toString());
    setOperation(undefined);
    setPreviousOperand('');
    setOverwrite(true);
  }, [currentOperand, previousOperand, operation]);

  // 選擇運算符號
  const chooseOperation = useCallback((op: string) => {
    if (currentOperand === '') return;
    if (previousOperand !== '') {
      // 這裡不能直接呼叫 compute() 因為 compute 依賴 state，
      // 在這個閉包中可能不是最新的。
      // 但為了保持原本邏輯結構，我們手動執行一次計算邏輯或依賴 useEffect
      // 在此範例結構中，為求穩定，我們計算當前值傳入
      
      const prev = parseFloat(previousOperand);
      const current = parseFloat(currentOperand);
      let computation: number = 0;
      
      if (!isNaN(prev) && !isNaN(current)) {
         switch (operation) {
          case '+': computation = prev + current; break;
          case '-': computation = prev - current; break;
          case '*': computation = prev * current; break;
          case '÷':
          case '/': computation = prev / current; break;
          default: return;
        }
        computation = Math.round(computation * 100000000) / 100000000;
        setPreviousOperand(computation.toString());
      } else {
         setPreviousOperand(currentOperand);
      }
    } else {
       setPreviousOperand(currentOperand);
    }
    
    setOperation(op);
    setCurrentOperand('');
  }, [currentOperand, previousOperand, operation]);


  // 鍵盤監聽
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        appendNumber(e.key);
      } else if (e.key === '.') {
        appendNumber('.');
      } else if (e.key === '=' || e.key === 'Enter') {
        e.preventDefault();
        compute();
      } else if (e.key === 'Backspace') {
        deleteNumber();
      } else if (e.key === 'Escape') {
        clear();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        // 將鍵盤的 / 轉換為介面顯示的 ÷ (如果需要)
        const op = e.key === '/' ? '÷' : e.key;
        chooseOperation(op);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [appendNumber, compute, deleteNumber, clear, chooseOperation]); 

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-sm bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
        
        {/* 標題列 */}
        <div className="flex justify-between items-center p-4 text-gray-400 border-b border-gray-700/50 select-none">
          <div className="flex items-center gap-2">
            <Calculator size={18} />
            <span className="text-sm font-medium">Standard</span>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
          </div>
        </div>

        {/* 螢幕顯示區 */}
        <div className="p-6 flex flex-col items-end justify-end h-40 break-all bg-gradient-to-b from-gray-800 to-gray-800/80">
          <div className="text-gray-400 text-lg h-8 font-medium tracking-wide flex items-center gap-1">
            {formatOperand(previousOperand)} {operation}
          </div>
          <div className="text-white text-5xl font-light tracking-wider overflow-x-auto w-full text-right scrollbar-hide whitespace-nowrap">
            {formatOperand(currentOperand) || '0'}
          </div>
        </div>

        {/* 按鍵區 */}
        <div className="grid grid-cols-4 gap-3 p-4 bg-gray-800 select-none">
          
          {/* 第一排: 功能鍵 */}
          <button onClick={clear} className="col-span-2 p-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-red-500/50">
            AC
          </button>
          <button onClick={deleteNumber} className="p-4 rounded-2xl bg-gray-700 text-gray-300 hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500">
            <Delete size={24} />
          </button>
          <button onClick={() => chooseOperation('÷')} className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            ÷
          </button>

          {/* 數字與運算符 */}
          <button onClick={() => appendNumber('7')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">7</button>
          <button onClick={() => appendNumber('8')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">8</button>
          <button onClick={() => appendNumber('9')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">9</button>
          <button onClick={() => chooseOperation('*')} className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">×</button>

          <button onClick={() => appendNumber('4')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">4</button>
          <button onClick={() => appendNumber('5')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">5</button>
          <button onClick={() => appendNumber('6')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">6</button>
          <button onClick={() => chooseOperation('-')} className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">-</button>

          <button onClick={() => appendNumber('1')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">1</button>
          <button onClick={() => appendNumber('2')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">2</button>
          <button onClick={() => appendNumber('3')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium focus:outline-none focus:ring-2 focus:ring-gray-600">3</button>
          <button onClick={() => chooseOperation('+')} className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50">+</button>

          {/* 最後一排 */}
          <button onClick={() => appendNumber('0')} className="col-span-2 p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-medium text-left pl-8 focus:outline-none focus:ring-2 focus:ring-gray-600">0</button>
          <button onClick={() => appendNumber('.')} className="p-4 rounded-2xl bg-gray-700/50 text-white hover:bg-gray-700 active:scale-95 transition-all text-xl font-bold focus:outline-none focus:ring-2 focus:ring-gray-600">.</button>
          <button onClick={compute} className="p-4 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 transition-all font-bold text-xl shadow-lg shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-400">
            =
          </button>
        </div>
      </div>
    </div>
  );
}