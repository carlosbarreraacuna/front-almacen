'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  X, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Copy,
  RotateCcw,
  Info
} from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
}

type CalculatorMode = 'basic' | 'discount' | 'tax' | 'profit' | 'installments';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function BasicCalculator({ 
  onResult 
}: { 
  onResult: (result: number) => void; 
}) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
      onResult(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
      onResult(newValue);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const buttons = [
    ['C', '±', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '=']
  ];

  const handleButtonClick = (value: string) => {
    switch (value) {
      case 'C':
        clear();
        break;
      case '±':
        setDisplay(String(parseFloat(display) * -1));
        break;
      case '%':
        setDisplay(String(parseFloat(display) / 100));
        break;
      case '=':
        performCalculation();
        break;
      case '+':
      case '-':
      case '*':
      case '/':
        inputOperation(value);
        break;
      case '.':
        if (display.indexOf('.') === -1) {
          inputNumber(value);
        }
        break;
      default:
        inputNumber(value);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 text-white p-4 rounded-lg text-right">
        <div className="text-2xl font-mono">{display}</div>
        <div className="text-sm text-gray-400 mt-1">
          {formatCurrency(parseFloat(display) || 0)}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {buttons.flat().map((button, index) => (
          <button
            key={index}
            onClick={() => handleButtonClick(button)}
            className={`p-3 rounded-lg font-medium transition-colors ${
              ['C', '±', '%'].includes(button)
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : ['/', '*', '-', '+', '='].includes(button)
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            } ${button === '0' ? 'col-span-2' : ''}`}
          >
            {button}
          </button>
        ))}
      </div>
    </div>
  );
}

function DiscountCalculator({ 
  initialAmount = 0 
}: { 
  initialAmount?: number; 
}) {
  const [originalPrice, setOriginalPrice] = useState(initialAmount);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(originalPrice);

  useEffect(() => {
    const discount = (originalPrice * discountPercent) / 100;
    const final = originalPrice - discount;
    setDiscountAmount(discount);
    setFinalPrice(final);
  }, [originalPrice, discountPercent]);

  const handleDiscountAmountChange = (amount: number) => {
    setDiscountAmount(amount);
    const percent = originalPrice > 0 ? (amount / originalPrice) * 100 : 0;
    setDiscountPercent(percent);
    setFinalPrice(originalPrice - amount);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Original
          </label>
          <input
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descuento (%)
            </label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descuento ($)
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => handleDiscountAmountChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Precio Original:</span>
          <span className="font-medium">{formatCurrency(originalPrice)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Descuento:</span>
          <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Precio Final:</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(finalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxCalculator({ 
  initialAmount = 0 
}: { 
  initialAmount?: number; 
}) {
  const [baseAmount, setBaseAmount] = useState(initialAmount);
  const [taxRate, setTaxRate] = useState(19); // IVA Colombia
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(baseAmount);
  const [includesTax, setIncludesTax] = useState(false);

  useEffect(() => {
    if (includesTax) {
      // El monto incluye impuestos, calcular base
      const base = baseAmount / (1 + taxRate / 100);
      const tax = baseAmount - base;
      setTaxAmount(tax);
      setTotalAmount(baseAmount);
    } else {
      // El monto es la base, calcular impuestos
      const tax = (baseAmount * taxRate) / 100;
      const total = baseAmount + tax;
      setTaxAmount(tax);
      setTotalAmount(total);
    }
  }, [baseAmount, taxRate, includesTax]);

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {includesTax ? 'Monto con Impuestos' : 'Monto Base'}
          </label>
          <input
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa de Impuesto (%)
            </label>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>0% - Exento</option>
              <option value={5}>5% - Productos básicos</option>
              <option value={19}>19% - IVA General</option>
              <option value={8}>8% - Algunos alimentos</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includesTax}
                onChange={(e) => setIncludesTax(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Incluye impuestos</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Base Gravable:</span>
          <span className="font-medium">
            {formatCurrency(includesTax ? baseAmount / (1 + taxRate / 100) : baseAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Impuesto ({taxRate}%):</span>
          <span className="font-medium text-green-600">{formatCurrency(taxAmount)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-green-600">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfitCalculator() {
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [markup, setMarkup] = useState(0);

  useEffect(() => {
    const profit = sellingPrice - costPrice;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const markupPercent = costPrice > 0 ? (profit / costPrice) * 100 : 0;
    
    setProfitAmount(profit);
    setProfitMargin(margin);
    setMarkup(markupPercent);
  }, [costPrice, sellingPrice]);

  const handleMarkupChange = (markupPercent: number) => {
    setMarkup(markupPercent);
    const newSellingPrice = costPrice * (1 + markupPercent / 100);
    setSellingPrice(newSellingPrice);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio de Costo
          </label>
          <input
            type="number"
            value={costPrice}
            onChange={(e) => setCostPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio de Venta
          </label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Markup (%)
          </label>
          <input
            type="number"
            value={markup}
            onChange={(e) => handleMarkupChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Costo:</span>
          <span className="font-medium">{formatCurrency(costPrice)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Venta:</span>
          <span className="font-medium">{formatCurrency(sellingPrice)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Ganancia:</span>
          <span className={`font-medium ${
            profitAmount >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(profitAmount)}
          </span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Margen:</span>
            <span className={`font-bold ${
              profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'
            }`}>
              {profitMargin.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstallmentCalculator() {
  const [totalAmount, setTotalAmount] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [installments, setInstallments] = useState(12);
  const [interestRate, setInterestRate] = useState(2.5);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);

  useEffect(() => {
    const principal = totalAmount - downPayment;
    const monthlyRate = interestRate / 100;
    
    if (principal > 0 && monthlyRate > 0) {
      const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                     (Math.pow(1 + monthlyRate, installments) - 1);
      const totalPayments = payment * installments;
      const interest = totalPayments - principal;
      
      setMonthlyPayment(payment);
      setTotalInterest(interest);
      setTotalToPay(totalPayments + downPayment);
    } else {
      setMonthlyPayment(principal / installments);
      setTotalInterest(0);
      setTotalToPay(totalAmount);
    }
  }, [totalAmount, downPayment, installments, interestRate]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto Total
          </label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuota Inicial
          </label>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuotas
            </label>
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={18}>18 meses</option>
              <option value={24}>24 meses</option>
              <option value={36}>36 meses</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interés Mensual (%)
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              step="0.1"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Cuota Inicial:</span>
          <span className="font-medium">{formatCurrency(downPayment)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Cuota Mensual:</span>
          <span className="font-medium text-orange-600">{formatCurrency(monthlyPayment)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Total Intereses:</span>
          <span className="font-medium text-red-600">{formatCurrency(totalInterest)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total a Pagar:</span>
            <span className="text-xl font-bold text-orange-600">{formatCurrency(totalToPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialCalculator({ 
  isOpen, 
  onClose, 
  initialAmount = 0 
}: CalculatorProps) {
  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [result, setResult] = useState(0);

  const modes = [
    { id: 'basic', name: 'Básica', icon: Calculator },
    { id: 'discount', name: 'Descuentos', icon: Percent },
    { id: 'tax', name: 'Impuestos', icon: DollarSign },
    { id: 'profit', name: 'Rentabilidad', icon: TrendingUp },
    { id: 'installments', name: 'Cuotas', icon: Calendar }
  ];

  const copyResult = () => {
    navigator.clipboard.writeText(result.toString());
  };

  const reset = () => {
    setResult(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Calculator className="w-6 h-6 mr-2" />
            Calculadora Financiera
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyResult}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Copiar resultado"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={reset}
              className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="flex flex-wrap gap-2 mb-6">
          {modes.map((modeOption) => {
            const Icon = modeOption.icon;
            return (
              <button
                key={modeOption.id}
                onClick={() => setMode(modeOption.id as CalculatorMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  mode === modeOption.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{modeOption.name}</span>
              </button>
            );
          })}
        </div>

        {/* Contenido del calculador */}
        <div className="min-h-[400px]">
          {mode === 'basic' && (
            <BasicCalculator onResult={setResult} />
          )}
          {mode === 'discount' && (
            <DiscountCalculator initialAmount={initialAmount} />
          )}
          {mode === 'tax' && (
            <TaxCalculator initialAmount={initialAmount} />
          )}
          {mode === 'profit' && (
            <ProfitCalculator />
          )}
          {mode === 'installments' && (
            <InstallmentCalculator />
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Consejos:</p>
              <ul className="space-y-1 text-xs">
                {mode === 'basic' && (
                  <li>• Usa la calculadora básica para operaciones rápidas durante la venta</li>
                )}
                {mode === 'discount' && (
                  <li>• Calcula descuentos por porcentaje o monto fijo automáticamente</li>
                )}
                {mode === 'tax' && (
                  <li>• Incluye o excluye IVA según el tipo de producto</li>
                )}
                {mode === 'profit' && (
                  <li>• Analiza la rentabilidad antes de fijar precios de venta</li>
                )}
                {mode === 'installments' && (
                  <li>• Calcula cuotas para ventas a crédito con intereses</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}