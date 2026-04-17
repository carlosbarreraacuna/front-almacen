'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { productApi } from '../services/api';
import * as XLSX from 'xlsx';

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export function ProductImportModal({ isOpen, onClose, onImportSuccess }: ProductImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
      setImportErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);
    setImportErrors([]);

    try {
      const result = await productApi.importProducts(file);
      
      if (result.success) {
        setSuccess(`Productos importados exitosamente. Total: ${result.data.imported}`);
        
        if (result.data.errors && result.data.errors.length > 0) {
          setImportErrors(result.data.errors);
        }
        
        setTimeout(() => {
          onImportSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Error al importar productos');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await productApi.getImportTemplate();

      if (result.success) {
        const { headers, example } = result.data as { headers: string[]; example: (string | number)[] };

        // Col H (índice 7) = Precio Venta — aquí va la fórmula
        // D=idx3(Costo)  E=idx4(Flete)  F=idx5(IVA)  G=idx6(Margen)  H=idx7(Precio)
        const buildPrecioFormula = (row: number) => ({
          t: 'n' as const,
          f: `ROUND((D${row}+E${row})*(1+F${row}/100)*(1+G${row}/100),0)`,
        });

        // Fila de ejemplo con fórmula en col H (fila 2)
        const exampleRow = [...example];
        exampleRow[7] = buildPrecioFormula(2);

        // 30 filas vacías pre-formuladas (filas 3–32) para que el usuario ingrese datos
        const emptyRows = Array.from({ length: 30 }, (_, i) => {
          const row = new Array(headers.length).fill('');
          row[7] = buildPrecioFormula(i + 3);
          return row;
        });

        const wsData = [headers, exampleRow, ...emptyRows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = [
          { wch: 15 }, // A  SKU
          { wch: 32 }, // B  Nombre
          { wch: 22 }, // C  Categoría
          { wch: 12 }, // D  Costo Base
          { wch: 10 }, // E  Flete
          { wch: 8  }, // F  IVA
          { wch: 22 }, // G  Margen
          { wch: 16 }, // H  Precio Venta (fórmula)
          { wch: 13 }, // I  Descuento
          { wch: 8  }, // J  Stock
          { wch: 13 }, // K  Stock Mínimo
          { wch: 18 }, // L  Presentación
          { wch: 16 }, // M  Marca
          { wch: 32 }, // N  Modelos Compatibles
          { wch: 32 }, // O  Descripción
          { wch: 14 }, // P  Fecha Creación
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        XLSX.writeFile(wb, 'plantilla_importacion_productos.xlsx');
      }
    } catch {
      setError('Error al descargar la plantilla');
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setImportErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Importar Productos</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instrucciones */}
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Instrucciones generales:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Descarga la plantilla y completa los datos</li>
                <li>Campos obligatorios: <strong>SKU, Nombre, Stock</strong></li>
                <li>Si el SKU ya existe, el producto se actualizará</li>
                <li>Categoría y Marca se crean automáticamente si no existen</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-700">Columnas de la plantilla</p>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {[
                  { col: 'A — SKU', req: true,  desc: 'Código único del producto' },
                  { col: 'B — Nombre', req: true,  desc: 'Nombre del producto' },
                  { col: 'C — Categoría', req: false, desc: 'Se crea si no existe' },
                  { col: 'D — Costo Base', req: false, desc: 'Precio de compra sin extras' },
                  { col: 'E — Flete ($)', req: false, desc: 'Costo de transporte por producto' },
                  { col: 'F — IVA (%)', req: false, desc: 'Ej: 19 para gravado, 0 para exento' },
                  { col: 'G — Margen (%)', req: false, desc: 'Porcentaje de ganancia' },
                  { col: 'H — Precio Venta', req: false, desc: 'Fórmula automática. Escribe manualmente para anular' },
                  { col: 'I — Descuento (%)', req: false, desc: '0–100' },
                  { col: 'J — Stock', req: true,  desc: 'Cantidad disponible' },
                  { col: 'K — Stock Mínimo', req: false, desc: 'Para alertas de stock bajo' },
                  { col: 'L — Unidad de Medida', req: false, desc: 'Ej: CAJA X10, unidad' },
                  { col: 'M — Marca', req: false, desc: 'Se crea si no existe' },
                  { col: 'N — Modelos Compatibles', req: false, desc: 'Separados por / (ej: BM100 / PULSAR 180)' },
                  { col: 'O — Descripción', req: false, desc: '' },
                ].map(({ col, req, desc }) => (
                  <div key={col} className="flex items-start px-4 py-1.5 gap-3">
                    <span className="w-40 font-medium text-gray-700 flex-shrink-0">
                      {col}
                      {req && <span className="ml-1 text-red-500">*</span>}
                    </span>
                    <span className="text-gray-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">Fórmula de precio automático:</p>
              <code className="block bg-amber-100 px-2 py-1 rounded font-mono">
                Precio = (Costo Base + Flete) × (1 + IVA/100) × (1 + Margen/100)
              </code>
              <p className="mt-1">Ejemplo: (8.000 + 2.000) × 1,19 × 1,30 = <strong>$15.470</strong></p>
            </div>
          </div>

          {/* Botón descargar plantilla */}
          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Descargar Plantilla de Excel</span>
          </button>

          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {file ? file.name : 'Selecciona un archivo Excel o CSV'}
                  </span>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    Formatos permitidos: .xlsx, .xls, .csv (máx. 10MB)
                  </span>
                </label>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar Archivo
              </button>
            </div>
          </div>

          {/* Mensajes de error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Mensajes de éxito */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Éxito</p>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Errores de importación */}
          {importErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                Advertencias durante la importación:
              </p>
              <div className="max-h-40 overflow-y-auto">
                <ul className="text-sm text-yellow-800 space-y-1">
                  {importErrors.map((err, index) => (
                    <li key={index} className="text-xs">
                      Fila {err.row}: {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={importing}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Importando...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Importar Productos</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
