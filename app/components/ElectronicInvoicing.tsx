'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Mail,
  Shield,
  Clock,
  RefreshCw,
  QrCode,
  Scan,
  User,
  ShoppingCart,
  Calculator,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Building,
  Hash,
  DollarSign,
  Percent,
  Plus,
  Minus,
  Save,
  Printer
} from 'lucide-react';
import InvoiceTemplate, { Company, Customer as TemplateCustomer, InvoiceData as TemplateInvoiceData, Product } from './InvoiceTemplate';
import ThermalPrint from './ThermalPrint';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  documentType?: 'CC' | 'NIT' | 'CE' | 'PP';
  documentNumber?: string;
  document?: string;
  isVIP?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  taxRate?: number;
  discount?: number;
}

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'sent' | 'accepted' | 'rejected';
  dianStatus?: 'pending' | 'approved' | 'rejected' | 'error';
  cufe?: string;
  qrCode?: string;
  pdfUrl?: string;
  xmlUrl?: string;
}

interface ElectronicInvoicingProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  cart: CartItem[];
  onInvoiceGenerated?: (invoice: InvoiceData) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}

function calculateTotals(items: any[]) {
  const subtotal = items.reduce((sum, item) => {
    // Manejar tanto la estructura con product como la estructura directa
    const price = item.product?.price || item.price || 0;
    const quantity = item.quantity || 0;
    return sum + (price * quantity);
  }, 0);

  const discount = items.reduce((sum, item) => {
    // Manejar tanto la estructura con product como la estructura directa
    const price = item.product?.price || item.price || 0;
    const quantity = item.quantity || 0;
    const discountPercent = item.discount || 0;
    const itemSubtotal = price * quantity;
    const discountAmount = (itemSubtotal * discountPercent) / 100;
    return sum + discountAmount;
  }, 0);

  const taxRate = 19;
  const tax = items.reduce((sum, item) => {
    // Manejar tanto la estructura con product como la estructura directa
    const price = item.product?.price || item.price || 0;
    const quantity = item.quantity || 0;
    const discountPercent = item.discount || 0;
    const itemSubtotal = price * quantity;
    const discountAmount = (itemSubtotal * discountPercent) / 100;
    const taxableAmount = itemSubtotal - discountAmount;
    return sum + (taxableAmount * taxRate / 100);
  }, 0);

  const total = subtotal - discount + tax;

  return { subtotal, discount, tax, total };
}

export default function ElectronicInvoicing({
  isOpen,
  onClose,
  customer,
  cart,
  onInvoiceGenerated
}: ElectronicInvoicingProps) {
  const [step, setStep] = useState<'preview' | 'validation' | 'generation' | 'complete'>('preview');
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [validations, setValidations] = useState<Array<{type: string; status: 'success' | 'warning' | 'error'; message: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedInvoice, setScannedInvoice] = useState<any>(null);
  const [qrScanMode, setQrScanMode] = useState<'reprint' | 'return' | 'verify'>('verify');

  useEffect(() => {
    if (isOpen && customer && cart.length > 0) {
      const totals = calculateTotals(cart);
      const newInvoice: InvoiceData = {
        id: `inv_${Date.now()}`,
        number: `FE${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        customer,
        items: cart,
        ...totals,
        status: 'draft'
      };
      setInvoice(newInvoice);
      setStep('preview');
    }
  }, [isOpen, customer, cart]);

  if (!isOpen) return null;

  const handleGenerateInvoice = async () => {
    if (!invoice) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simular validaciones
      const newValidations = [
        { type: 'customer', status: 'success' as const, message: 'Datos del cliente válidos' },
        { type: 'items', status: 'success' as const, message: 'Productos válidos' },
        { type: 'totals', status: 'success' as const, message: 'Cálculos correctos' },
        { type: 'dian', status: 'success' as const, message: 'Conexión con DIAN establecida' }
      ];
      
      setValidations(newValidations);
      setStep('validation');
      
      // Simular proceso de generación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedInvoice = {
        ...invoice,
        status: 'sent' as const,
        dianStatus: 'approved' as const,
        cufe: `CUFE${Date.now()}`,
        qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg=='
      };
      
      setInvoice(updatedInvoice);
      setStep('complete');
      
      if (onInvoiceGenerated) {
        onInvoiceGenerated(updatedInvoice);
      }
    } catch (err) {
      setError('Error al generar la factura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    // Verificar que existe el contenido de la factura
    const invoiceContent = document.querySelector('.invoice-print-content');
    if (!invoiceContent) {
      alert('No se encontró el contenido de la factura para imprimir');
      return;
    }
    
    // Crear estilos CSS para impresión que preserven exactamente la vista previa
    const printStyles = `
      <style id="print-styles">
        @media print {
          /* Ocultar todo el contenido de la página excepto el contenedor de impresión */
          body > *:not(.print-container) {
            display: none !important;
          }
          
          /* Configurar el contenedor de impresión */
          .print-container {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Preservar exactamente los estilos de la vista previa */
          .invoice-print-content {
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace !important;
            font-size: 0.75rem !important;
            line-height: 1rem !important;
            padding: 1rem !important;
          }
          
          /* Preservar todos los estilos de texto y elementos */
          .invoice-print-content * {
            color: inherit !important;
            font-family: inherit !important;
            background: transparent !important;
          }
          
          /* Preservar imágenes y QR codes */
          .invoice-print-content img {
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
          }
          
          /* Preservar bordes y separadores */
          .invoice-print-content .border-t,
          .invoice-print-content .border-b {
            border-color: #9ca3af !important;
          }
          
          /* Preservar espaciado */
          .invoice-print-content .mb-1 { margin-bottom: 0.25rem !important; }
          .invoice-print-content .mb-2 { margin-bottom: 0.5rem !important; }
          .invoice-print-content .mb-4 { margin-bottom: 1rem !important; }
          .invoice-print-content .pt-1 { padding-top: 0.25rem !important; }
          .invoice-print-content .pt-2 { padding-top: 0.5rem !important; }
          .invoice-print-content .pb-1 { padding-bottom: 0.25rem !important; }
          .invoice-print-content .mt-2 { margin-top: 0.5rem !important; }
          
          /* Preservar alineación de texto */
          .invoice-print-content .text-center { text-align: center !important; }
          .invoice-print-content .text-right { text-align: right !important; }
          .invoice-print-content .text-left { text-align: left !important; }
          
          /* Preservar peso de fuente */
          .invoice-print-content .font-bold { font-weight: 700 !important; }
          
          /* Preservar flexbox */
          .invoice-print-content .flex { display: flex !important; }
          .invoice-print-content .justify-between { justify-content: space-between !important; }
          .invoice-print-content .items-center { align-items: center !important; }
          .invoice-print-content .flex-1 { flex: 1 1 0% !important; }
          
          /* Configuración de página optimizada para tickets */
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          
          /* Ocultar elementos de la interfaz */
          .fixed,
          .bg-black,
          .bg-opacity-50,
          button,
          .cursor-pointer,
          nav,
          header,
          footer,
          .modal-overlay {
            display: none !important;
          }
          
          /* Asegurar que los colores se impriman */
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `;
    
    // Crear un contenedor temporal para la impresión
    const printContainer = document.createElement('div');
    printContainer.className = 'print-container';
    printContainer.style.display = 'none';
    
    // Clonar el contenido de la factura preservando todos los estilos
    const invoiceElement = document.querySelector('.invoice-print-content');
    if (invoiceElement) {
      const clonedInvoice = invoiceElement.cloneNode(true) as HTMLElement;
      
      // Preservar estilos computados para elementos críticos
      const preserveComputedStyles = (original: Element, clone: Element) => {
        const originalStyles = window.getComputedStyle(original);
        const cloneElement = clone as HTMLElement;
        
        // Preservar estilos de fuente y espaciado
        cloneElement.style.fontFamily = originalStyles.fontFamily;
        cloneElement.style.fontSize = originalStyles.fontSize;
        cloneElement.style.lineHeight = originalStyles.lineHeight;
        cloneElement.style.color = originalStyles.color;
        cloneElement.style.backgroundColor = originalStyles.backgroundColor;
        cloneElement.style.margin = originalStyles.margin;
        cloneElement.style.padding = originalStyles.padding;
        cloneElement.style.textAlign = originalStyles.textAlign;
        cloneElement.style.fontWeight = originalStyles.fontWeight;
        
        // Recursivamente aplicar a elementos hijos
        for (let i = 0; i < original.children.length; i++) {
          if (clone.children[i]) {
            preserveComputedStyles(original.children[i], clone.children[i]);
          }
        }
      };
      
      // Aplicar preservación de estilos
      preserveComputedStyles(invoiceElement, clonedInvoice);
      
      printContainer.appendChild(clonedInvoice);
    }
    
    // Agregar el contenedor al body
    document.body.appendChild(printContainer);
    
    // Agregar los estilos al head
    const existingStyles = document.getElementById('print-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    document.head.insertAdjacentHTML('beforeend', printStyles);
    
    // Imprimir directamente
    window.print();
    
    // Limpiar después de la impresión
    setTimeout(() => {
      const stylesToRemove = document.getElementById('print-styles');
      if (stylesToRemove) {
        stylesToRemove.remove();
      }
      if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
    }, 1000);
  };

  const renderInvoicePreview = () => {
    if (!invoice || !customer) return null;

    const company: Company = {
      name: 'Almacen y taller Moto Spa del Caribe',
      nit: '800.140.605-5',
      address: 'Av. Pedro Romero No. 30-21 LOCAL COMERCIAL',
      city: 'CARTAGENA',
      phone: '3013502893',
      email: 'elbertobarrera123@gmail.com',
      regime: 'COMÚN',
      activity: 'Venta de repuestos',
      logo: '/logoalmacen.jpeg'
    };

    const templateCustomer: TemplateCustomer = {
      name: customer.name,
      document: customer.document || customer.documentNumber || '',
      documentType: customer.documentType || 'CC',
      address: customer.address || '',
      city: 'CARTAGENA',
      phone: customer.phone,
      email: customer.email
    };

    const products: Product[] = cart.map(item => ({
      id: item.id,
      code: `PROD-${item.id}`,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      taxRate: item.taxRate || 19,
      total: item.total
    }));

    const templateInvoice: TemplateInvoiceData = {
      number: invoice.number,
      prefix: 'FE',
      date: new Date(invoice.date),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cufe: invoice.cufe || 'CUFE-PENDING',
      authorizationNumber: '18415109662',
      authorizationDate: new Date(),
      environment: 'PRUEBAS',
      emission: 'NORMAL',
      products,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      taxableBase: invoice.subtotal - invoice.discount,
      iva: invoice.tax,
      totalTax: invoice.tax,
      total: invoice.total,
      paymentMethod: 'Efectivo',
      cashier: 'Cajero 1',
      terminal: '1-3'
    };

    return (
      <InvoiceTemplate
        company={company}
        customer={templateCustomer}
        invoice={templateInvoice}
        qrCode={invoice.qrCode}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Facturación Electrónica</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : step === 'validation' || step === 'generation' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-100' : step === 'validation' || step === 'generation' || step === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Vista Previa</span>
              </div>
              <div className={`w-8 h-0.5 ${step === 'validation' || step === 'generation' || step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center space-x-2 ${step === 'validation' ? 'text-blue-600' : step === 'generation' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'validation' ? 'bg-blue-100' : step === 'generation' || step === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Validación</span>
              </div>
              <div className={`w-8 h-0.5 ${step === 'complete' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center space-x-2 ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Completado</span>
              </div>
            </div>
          </div>

          {/* Content based on step */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Vista Previa de la Factura</h3>
                <div className="bg-white rounded-lg shadow-sm invoice-print-content">
                  {renderInvoicePreview()}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <ThermalPrint 
                  content={renderInvoicePreview()}
                  title={`Factura ${invoice?.number || ''}`}
                />
                <button
                  onClick={handleGenerateInvoice}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Generar Factura</span>
                </button>
              </div>
            </div>
          )}

          {step === 'validation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Validando Factura...</h3>
              <div className="space-y-3">
                {validations.map((validation, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {validation.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {validation.status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                    {validation.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="text-sm">{validation.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Factura Generada Exitosamente!</h3>
                <p className="text-gray-600">Factura No. {invoice?.number}</p>
                <p className="text-sm text-gray-500">CUFE: {invoice?.cufe}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="bg-white rounded-lg shadow-sm invoice-print-content">
                  {renderInvoicePreview()}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>
                <ThermalPrint 
                  content={renderInvoicePreview()}
                  title={`Factura ${invoice?.number}`}
                />
                <button
                  onClick={() => {
                    // Simular descarga
                    const link = document.createElement('a');
                    link.href = 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE3NAolJUVPRgo=';
                    link.download = `factura-${invoice?.number}.pdf`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Finalizar
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}