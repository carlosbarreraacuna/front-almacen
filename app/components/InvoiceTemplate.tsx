'use client';

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Product {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

interface Company {
  name: string;
  nit: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  regime: string;
  activity: string;
  logo?: string;
}

interface Customer {
  name: string;
  document: string;
  documentType: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
}

interface InvoiceData {
  number: string;
  prefix: string;
  date: Date;
  dueDate: Date;
  cufe: string;
  authorizationNumber: string;
  authorizationDate: Date;
  environment: 'PRODUCCION' | 'PRUEBAS';
  emission: 'NORMAL' | 'CONTINGENCIA';
  products: Product[];
  subtotal: number;
  discount: number;
  taxableBase: number;
  iva: number;
  totalTax: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  cashier?: string;
  terminal?: string;
  resolution?: string;
  resolutionDate?: Date;
  validFrom?: string;
  validTo?: string;
  technicalKey?: string;
  softwareProvider?: string;
  softwareId?: string;
}

interface InvoiceTemplateProps {
  company: Company;
  customer: Customer;
  invoice: InvoiceData;
  qrCode?: string;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  company,
  customer,
  invoice,
  qrCode
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="invoice-print-content max-w-sm mx-auto bg-white p-4 text-xs font-mono print:shadow-none" style={{width: '80mm'}}>
      {/* Header with Logo */}
      <div className="text-center mb-4">
        {company.logo ? (
          <img src={company.logo} alt="Logo" className="w-16 h-16 mx-auto mb-2" />
        ) : (
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold">F</span>
          </div>
        )}
        <h1 className="font-bold text-sm">{company.name}</h1>
        <p className="text-xs">Califica la experiencia</p>
      </div>

      {/* QR Code */}
      {qrCode && (
        <div className="text-center mb-4">
          <img src={qrCode} alt="QR Code" className="w-20 h-20 mx-auto" />
        </div>
      )}

      {/* Invoice Type */}
      <div className="text-center mb-4">
        <p className="font-bold">Factura Electrónica de Venta</p>
        <p>No. {invoice.prefix}{invoice.number}</p>
      </div>

      {/* Company Details */}
      <div className="mb-4 text-xs">
        <p>{company.name}</p>
        <p>NIT: {company.nit}</p>
        <p>{company.address}</p>
        <p>{company.city}</p>
        <p>Teléfono: {company.phone}</p>
        <p>Email: {company.email}</p>
        <p>Régimen: {company.regime}</p>
        <p>Actividad: {company.activity}</p>
      </div>

      {/* Invoice Details */}
      <div className="mb-4 text-xs">
        <p>Atención: {invoice.cashier || 'N/A'}</p>
        <p>Terminal: {invoice.terminal || 'N/A'}</p>
        <p>Fecha: {formatDateTime(invoice.date)}</p>
        <p>Cajero: {invoice.cashier || 'N/A'}</p>
        <p>Cliente: CONSUMIDOR FINAL</p>
        <p>Documento: {customer.document}</p>
        <p>Teléfono: {customer.phone || 'N/A'}</p>
        <p>Pedido: {invoice.number}</p>
      </div>

      {/* Products Section */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-bold border-b pb-1 mb-2">
          <span>Producto</span>
          <span>Cant</span>
          <span>Precio</span>
        </div>
        
        {invoice.products.map((product, index) => (
          <div key={product.id} className="mb-2">
            <div className="flex justify-between text-xs">
              <span className="flex-1 pr-2">{product.description}</span>
              <span className="w-8 text-center">{product.quantity}</span>
              <span className="w-16 text-right">{formatCurrency(product.total)}</span>
            </div>
            {product.code && (
              <div className="text-xs text-gray-600 ml-0">
                Código: {product.code}
              </div>
            )}
            {product.discount > 0 && (
              <div className="text-xs text-gray-600 ml-0">
                Descuento: -{formatCurrency(product.discount)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="border-t border-gray-400 pt-2 mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Valor inicial Fact</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>Total Factura</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span>Imp. Consumo</span>
          <span>$ 0</span>
        </div>
        <div className="border-t border-gray-400 pt-1 mt-2">
          <div className="flex justify-between text-xs font-bold">
            <span>Total a pagar</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-4 text-xs">
        <p>Responsabilidad de IVA e Impuesto al</p>
        <p>Consumo: Sí</p>
        <p>Gran contribuyente según</p>
        <p>Resolución 000000 del 27 de diciembre</p>
        <p>2024. Autorretenedores de renta según</p>
        <p>Resolución 000000 del 27 de diciembre</p>
        <p>2024. Autorretenedores de ICA según</p>
        <p>Resolución autorizada según formulario</p>
        <p>de inscripción diligenciado el</p>
        <p>25/12/2020. DIAN 18415109662 AL</p>
        <p>18415109661 VIGENCIA ICA BOGOTÁ</p>
        <p>municipio CIJU 5612</p>
      </div>

      {/* Technical Information */}
      <div className="mb-4 text-xs">
        <p>Los datos representados en este</p>
        <p>documento electrónico son auténticos</p>
        <p>conforme a las fines establecidas en el numeral 1</p>
        <p>del artículo 5 de la Ley 527 de 1999 y</p>
        <p>se encuentran validados en la plataforma</p>
        <p>Frisby con el proveedor tecnológico</p>
        <p>Facturación Electrónica Integral</p>
        <p>Tecnológica Empresarial Tecnología y Servicios S</p>
        <p>A S en C</p>
      </div>

      {/* QR Code for verification */}
      {qrCode && (
        <div className="text-center mb-4">
          <img src={qrCode} alt="QR Code" className="w-24 h-24 mx-auto" />
          <p className="text-xs mt-2">Use el QR para descargar su factura</p>
          <p className="text-xs">https://</p>
          <p className="text-xs">www.frisby.com.co/factura/</p>
          <p className="text-xs">La factura se declara al correo electrónico</p>
          <p className="text-xs">del cliente</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs">
        <p>Proveedor Tecnológico: Carvajal</p>
        <p>Tecnología y Servicios S A S</p>
        <p>NIT: 890.904.640-1</p>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          
          .invoice-print-content {
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
            page-break-inside: avoid;
          }
          
          .print\:shadow-none {
            box-shadow: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .bg-gray-100,
          .bg-gray-50,
          .bg-gray-200 {
            background-color: #f5f5f5 !important;
          }
          
          /* Reduce spacing for print */
          .mb-4 {
            margin-bottom: 2mm !important;
          }
          
          .mb-2 {
            margin-bottom: 1mm !important;
          }
          
          .mb-1 {
            margin-bottom: 0.5mm !important;
          }
          
          .pt-2 {
            padding-top: 1mm !important;
          }
          
          .pb-1 {
            padding-bottom: 0.5mm !important;
          }
          
          /* Optimize image sizes */
          img {
            max-width: 15mm !important;
            max-height: 15mm !important;
          }
          
          /* Ensure text fits */
          .text-xs {
            font-size: 7px !important;
            line-height: 1.1 !important;
          }
          
          .text-sm {
            font-size: 8px !important;
            line-height: 1.1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceTemplate;
export type { InvoiceTemplateProps, InvoiceData, Company, Customer, Product };