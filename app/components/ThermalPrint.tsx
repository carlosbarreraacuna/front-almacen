'use client';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Printer } from 'lucide-react';

interface ThermalPrintProps {
  content: React.ReactNode;
  title?: string;
  onPrint?: () => void;
}

const ThermalPrint: React.FC<ThermalPrintProps> = ({ content, title = "Documento", onPrint }) => {
  const handleThermalPrint = () => {
    // Crear estilos temporales para impresión térmica
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        html {
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          overflow: visible !important;
        }
        
        body > * {
          display: none !important;
        }
        
        .thermal-print-active {
          display: block !important;
          position: relative !important;
          width: 100% !important;
          font-family: 'Courier New', monospace !important;
          font-size: 14px !important;
          line-height: 1.3 !important;
          color: black !important;
          background: white !important;
          margin: 0 !important;
          padding: 2mm !important;
          box-sizing: border-box !important;
          page-break-before: avoid !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        
        .thermal-print-active * {
          display: block !important;
          visibility: visible !important;
        }
        
        .thermal-print-active h1,
        .thermal-print-active h2,
        .thermal-print-active h3,
        .thermal-print-active h4,
        .thermal-print-active h5,
        .thermal-print-active h6 {
          font-size: 16px !important;
          font-weight: bold !important;
          margin: 3mm 0 2mm 0 !important;
          text-align: center !important;
        }
        
        .thermal-print-active .invoice-header {
          text-align: center !important;
          font-weight: bold !important;
          font-size: 15px !important;
          margin-bottom: 3mm !important;
        }
        
        .thermal-print-active .company-name {
          font-size: 18px !important;
          font-weight: bold !important;
          text-align: center !important;
          margin-bottom: 2mm !important;
        }
        
        .thermal-print-active .invoice-number {
          font-size: 15px !important;
          font-weight: bold !important;
          text-align: center !important;
        }
        
        .thermal-print-active .section-title {
          font-size: 14px !important;
          font-weight: bold !important;
          margin: 2mm 0 1mm 0 !important;
        }
        
        .thermal-print-active p {
          font-size: 13px !important;
          margin: 1mm 0 !important;
          line-height: 1.3 !important;
        }
        
        .thermal-print-active .total-amount {
          font-size: 15px !important;
          font-weight: bold !important;
          text-align: right !important;
        }
        
        .thermal-print-active h1,
        .thermal-print-active h2,
        .thermal-print-active h3 {
          font-size: 12px;
          font-weight: bold;
          margin: 2mm 0;
        }
        
        .thermal-print-active p {
          margin: 1mm 0;
        }
        
        .thermal-print-active .invoice-header {
          text-align: center;
          border-bottom: 1px solid black;
          padding-bottom: 2mm;
          margin-bottom: 2mm;
        }
        
        .thermal-print-active .invoice-details {
          margin: 2mm 0;
        }
        
        .thermal-print-active .invoice-items {
          border-top: 1px solid black;
          border-bottom: 1px solid black;
          padding: 2mm 0;
        }
        
        .thermal-print-active .invoice-total {
          text-align: right;
          font-weight: bold;
          margin-top: 2mm;
        }
      }
    `;
    
    // Agregar estilos al documento
    document.head.appendChild(styleElement);
    
    // Crear contenedor temporal para impresión
    const printContainer = document.createElement('div');
    printContainer.className = 'thermal-print-active';
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.top = '-9999px';
    printContainer.style.visibility = 'hidden';
    
    // Agregar contenido al contenedor
     if (typeof content === 'string') {
       printContainer.innerHTML = content;
     } else {
       printContainer.innerHTML = ReactDOMServer.renderToString(content);
     }
    
    // Agregar al documento
    document.body.appendChild(printContainer);
    
    // Hacer visible solo para impresión
    printContainer.style.visibility = 'visible';
    printContainer.style.position = 'static';
    printContainer.style.left = 'auto';
    printContainer.style.top = 'auto';
    
    // Imprimir
    window.print();
    
    // Limpiar después de imprimir
    setTimeout(() => {
      document.head.removeChild(styleElement);
      document.body.removeChild(printContainer);
    }, 1000);
    
    // Ejecutar callback si existe
    if (onPrint) {
      onPrint();
    }
  };

  return (
    <>
      {/* Contenido oculto para impresión */}
      <div className="thermal-print-source" style={{ display: 'none' }}>
        {content}
      </div>
      
      {/* Botón de impresión térmica */}
      <button
        onClick={handleThermalPrint}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center space-x-2"
        title="Imprimir en impresora térmica"
      >
        <Printer className="w-4 h-4" />
        <span>Impresión Térmica</span>
      </button>
    </>
  );
};

export default ThermalPrint;