'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Eye,
  FileDown,
  Upload,
  Plus,
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  status: 'active' | 'inactive';
  image?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  cost_price?: number;
  unit_of_measure?: string;
  is_active?: boolean;
  category_id?: number;
}

interface ProductsDataTableProps {
  data: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  onView: (product: Product) => void;
  onImport?: () => void;
  onCreate?: () => void;
}

function ColumnFilter({
  column,
  placeholder,
  columnName,
}: {
  column: any;
  placeholder: string;
  columnName: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const columnFilterValue = column.getFilterValue();

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full flex items-center justify-between px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-500 truncate">
          {columnFilterValue || 'Buscar...'}
        </span>
        <Search className="h-3 w-3 text-gray-400 ml-1 flex-shrink-0" />
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-700 mb-2 px-1">
                {columnName}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  type="text"
                  value={(columnFilterValue ?? '') as string}
                  onChange={(e) => column.setFilterValue(e.target.value)}
                  placeholder={placeholder}
                  className="h-8 w-full text-xs pl-7"
                  autoFocus
                />
                {columnFilterValue && (
                  <button
                    onClick={() => {
                      column.setFilterValue('');
                      setShowDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ProductsDataTable({
  data,
  onEdit,
  onDelete,
  onView,
  onImport,
  onCreate,
}: ProductsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeColumnFilter, setActiveColumnFilter] = useState<{
    columnId: string;
    columnName: string;
  } | null>(null);

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'sku',
      header: ({ column }) => {
        const isActive = activeColumnFilter?.columnId === 'sku';
        return (
          <div className="relative">
            <button
              onClick={() => setActiveColumnFilter(isActive ? null : { columnId: 'sku', columnName: 'SKU' })}
              className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>SKU</span>
              <Search className="h-3 w-3" />
            </button>
            {isActive && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={(column.getFilterValue() as string) ?? ''}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="h-8 text-xs pl-7"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {(() => {
                    const uniqueValues = Array.from(
                      new Set(data.map((item) => item.sku))
                    ).filter(Boolean).sort();
                    const filterValue = (column.getFilterValue() as string) ?? '';
                    const filteredValues = filterValue
                      ? uniqueValues.filter((val) => val.toLowerCase().includes(filterValue.toLowerCase()))
                      : uniqueValues;
                    return filteredValues.length > 0 ? (
                      <div className="space-y-1">
                        {filteredValues.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              column.setFilterValue(value);
                              setActiveColumnFilter(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-gray-700"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No se encontraron valores</div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.getValue('sku')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        const isActive = activeColumnFilter?.columnId === 'name';
        return (
          <div className="relative">
            <button
              onClick={() => setActiveColumnFilter(isActive ? null : { columnId: 'name', columnName: 'PRODUCTO' })}
              className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>PRODUCTO</span>
              <Search className="h-3 w-3" />
            </button>
            {isActive && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={(column.getFilterValue() as string) ?? ''}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="h-8 text-xs pl-7"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {(() => {
                    const uniqueValues = Array.from(
                      new Set(data.map((item) => item.name))
                    ).filter(Boolean).sort();
                    const filterValue = (column.getFilterValue() as string) ?? '';
                    const filteredValues = filterValue
                      ? uniqueValues.filter((val) => val.toLowerCase().includes(filterValue.toLowerCase()))
                      : uniqueValues;
                    return filteredValues.length > 0 ? (
                      <div className="space-y-1">
                        {filteredValues.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              column.setFilterValue(value);
                              setActiveColumnFilter(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-gray-700"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No se encontraron valores</div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <div className="font-medium text-gray-900 truncate">{row.getValue('name')}</div>
          {row.original.description && (
            <div className="text-xs text-gray-500 truncate">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: ({ column }) => {
        const isActive = activeColumnFilter?.columnId === 'category';
        return (
          <div className="relative">
            <button
              onClick={() => setActiveColumnFilter(isActive ? null : { columnId: 'category', columnName: 'CATEGORÍA' })}
              className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>CATEGORÍA</span>
              <Search className="h-3 w-3" />
            </button>
            {isActive && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={(column.getFilterValue() as string) ?? ''}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="h-8 text-xs pl-7"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {(() => {
                    const uniqueValues = Array.from(
                      new Set(data.map((item) => item.category))
                    ).filter(Boolean).sort();
                    const filterValue = (column.getFilterValue() as string) ?? '';
                    const filteredValues = filterValue
                      ? uniqueValues.filter((val) => val.toLowerCase().includes(filterValue.toLowerCase()))
                      : uniqueValues;
                    return filteredValues.length > 0 ? (
                      <div className="space-y-1">
                        {filteredValues.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              column.setFilterValue(value);
                              setActiveColumnFilter(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-gray-700"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No se encontraron valores</div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="text-gray-700">{row.getValue('category')}</div>
      ),
    },
    {
      accessorKey: 'price',
      header: ({ column }) => {
        const isActive = activeColumnFilter?.columnId === 'price';
        return (
          <div className="relative">
            <button
              onClick={() => setActiveColumnFilter(isActive ? null : { columnId: 'price', columnName: 'PRECIO' })}
              className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>PRECIO</span>
              <Search className="h-3 w-3" />
            </button>
            {isActive && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={(column.getFilterValue() as string) ?? ''}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="h-8 text-xs pl-7"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {(() => {
                    const uniqueValues = Array.from(
                      new Set(data.map((item) => item.price.toString()))
                    ).filter(Boolean).sort((a, b) => parseFloat(a) - parseFloat(b));
                    const filterValue = (column.getFilterValue() as string) ?? '';
                    const filteredValues = filterValue
                      ? uniqueValues.filter((val) => val.includes(filterValue))
                      : uniqueValues;
                    return filteredValues.length > 0 ? (
                      <div className="space-y-1">
                        {filteredValues.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              column.setFilterValue(value);
                              setActiveColumnFilter(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-gray-700"
                          >
                            {new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: 'COP',
                            }).format(parseFloat(value))}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No se encontraron valores</div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => {
        const price = parseFloat(row.getValue('price'));
        const formatted = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(price);
        return <div className="font-medium text-gray-900">{formatted}</div>;
      },
    },
    {
      accessorKey: 'stock',
      header: ({ column }) => {
        const isActive = activeColumnFilter?.columnId === 'stock';
        return (
          <div className="relative">
            <button
              onClick={() => setActiveColumnFilter(isActive ? null : { columnId: 'stock', columnName: 'STOCK' })}
              className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>STOCK</span>
              <Search className="h-3 w-3" />
            </button>
            {isActive && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={(column.getFilterValue() as string) ?? ''}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="h-8 text-xs pl-7"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {(() => {
                    const uniqueValues = Array.from(
                      new Set(data.map((item) => item.stock.toString()))
                    ).filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
                    const filterValue = (column.getFilterValue() as string) ?? '';
                    const filteredValues = filterValue
                      ? uniqueValues.filter((val) => val.includes(filterValue))
                      : uniqueValues;
                    return filteredValues.length > 0 ? (
                      <div className="space-y-1">
                        {filteredValues.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              column.setFilterValue(value);
                              setActiveColumnFilter(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-gray-700"
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No se encontraron valores</div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number;
        const minStock = row.original.min_stock;
        const isLowStock = stock <= minStock;
        return (
          <div className="flex items-center space-x-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isLowStock
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {stock}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        const isActive = activeColumnFilter?.columnId === 'status';
        return (
          <div className="relative">
            <button
              onClick={() => setActiveColumnFilter(isActive ? null : { columnId: 'status', columnName: 'ESTADO' })}
              className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
            >
              <span>ESTADO</span>
              <Search className="h-3 w-3" />
            </button>
            {isActive && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Buscar..."
                      value={(column.getFilterValue() as string) ?? ''}
                      onChange={(e) => column.setFilterValue(e.target.value)}
                      className="h-8 text-xs pl-7"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {(() => {
                    const uniqueValues = Array.from(
                      new Set(data.map((item) => item.status))
                    ).filter(Boolean).sort();
                    const filterValue = (column.getFilterValue() as string) ?? '';
                    const filteredValues = filterValue
                      ? uniqueValues.filter((val) => val.toLowerCase().includes(filterValue.toLowerCase()))
                      : uniqueValues;
                    return filteredValues.length > 0 ? (
                      <div className="space-y-1">
                        {filteredValues.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              column.setFilterValue(value);
                              setActiveColumnFilter(null);
                            }}
                            className="w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded text-xs text-gray-700"
                          >
                            {value === 'active' ? 'Activo' : 'Inactivo'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">No se encontraron valores</div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );
      },
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="font-semibold text-gray-700">ACCIONES</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(product)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(product)}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleExport = () => {
    // Exporta los datos actualmente filtrados/visibles en la tabla
    const rows = table.getFilteredRowModel().rows;

    const exportData = rows.map((row) => {
      const p = row.original;
      return {
        'SKU':               p.sku,
        'Nombre':            p.name,
        'Categoría':         p.category,
        'Precio Venta':      p.price,
        'Costo':             p.cost_price ?? '',
        'Stock':             p.stock,
        'Stock Mínimo':      p.min_stock,
        'Unidad de Medida':  p.unit_of_measure ?? '',
        'Estado':            p.status === 'active' ? 'Activo' : 'Inactivo',
        'Descripción':       p.description ?? '',
        'Fecha Creación':    p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO') : '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Ajustar ancho de columnas automáticamente
    const colWidths = Object.keys(exportData[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...exportData.map((row) => String((row as any)[key] ?? '').length), 10),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const filename = `productos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar en todos los campos..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-10"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
              setSorting([]);
            }}
          >
            <span className="mr-2">Restablecer</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
          >
            <FileDown className="h-4 w-4 mr-2" />
            <span>Exportar Excel</span>
          </Button>
          {onImport && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onImport}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span>Importar Excel</span>
            </Button>
          )}
          {onCreate && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCreate}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Nuevo Producto</span>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-gray-50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-700">
            Mostrar
          </p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="h-8 w-16 rounded-md border border-gray-300 bg-white text-sm"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-700">
            de {table.getFilteredRowModel().rows.length} resultados
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-700">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span className="text-sm text-gray-500">/</span>
              <span className="text-sm text-gray-500">
                {table.getPageCount()}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dropdown de Filtro por Columna */}
      {activeColumnFilter && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setActiveColumnFilter(null)}
          />
        </>
      )}
    </div>
  );
}
