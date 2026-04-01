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
        const { headers, example } = result.data;
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // Crear hoja con encabezados y ejemplo
        const wsData = [headers, example];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Ajustar ancho de columnas
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        
        // Descargar archivo
        XLSX.writeFile(wb, 'plantilla_importacion_productos.xlsx');
      }
    } catch (err: any) {
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Instrucciones:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Descarga la plantilla de Excel haciendo clic en el botón de abajo</li>
              <li>Completa los datos de los productos en la plantilla</li>
              <li>Los campos obligatorios son: SKU, nombre, precio y stock</li>
              <li>Si el SKU ya existe, el producto se actualizará</li>
              <li>Sube el archivo completado para importar</li>
            </ul>
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
