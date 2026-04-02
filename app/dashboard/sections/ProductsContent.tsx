'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  X,
  Save,
  AlertCircle,
  Upload,
} from 'lucide-react';
import {
  productApi,
  categoryApi,
  ApiProduct,
  CreateProductData,
  UpdateProductData,
} from '../../services/api';
import Cookies from 'js-cookie';
import { ProductsDataTable } from '../../components/ProductsDataTable';
import { ProductImportModal } from '../../components/ProductImportModal';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string; // nombre legible
  price: number;
  stock: number;
  min_stock: number;
  status: 'active' | 'inactive';
  image?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Campos adicionales del backend
  cost_price?: number;
  unit_of_measure?: string;
  is_active?: boolean;
  category_id?: number; // ID real de categoría
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string; // guarda el ID como string para el <select>
  price: number;
  stock: number;
  min_stock: number;
  status: 'active' | 'inactive';
  description?: string;
  image?: string;
  images?: File[];
}

interface ProductFormErrors {
  name?: string;
  sku?: string;
  category?: string;
  price?: string;
  stock?: string;
  min_stock?: string;
  description?: string;
}

interface ProductFilters {
  search: string;
  category: string; // ID de categoría (string) o ''
  status: string; // '', 'active', 'inactive', 'low_stock'
}

type ModalMode = 'create' | 'edit' | 'view' | null;

type Category = { id: number; name: string };

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    status: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Permite que, al crear una categoría desde el modal, se preseleccione automáticamente
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadProducts();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper arriba del archivo
const toNumber = (v: unknown): number => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Dentro del componente
const loadProducts = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await productApi.getProducts({
      search: filters.search || undefined,
      category_id: filters.category ? parseInt(filters.category) : undefined,
      low_stock: filters.status === 'low_stock' ? true : undefined,
      out_of_stock: filters.status === 'out_of_stock' ? true : undefined,
    });

    if (response?.success) {
      const productsArray = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data)
        ? response.data
        : [];

      const mappedProducts: Product[] = productsArray.map((apiProduct: ApiProduct) => ({
        id: apiProduct.id,
        name: apiProduct.name,
        sku: apiProduct.sku,
        category: apiProduct.category?.name || 'Sin categoría',
        category_id: apiProduct.category_id ?? apiProduct.category?.id,
        price: toNumber(apiProduct.unit_price),
        stock: toNumber(apiProduct.stock_quantity),
        min_stock: toNumber(apiProduct.min_stock_level),
        status: apiProduct.is_active ? 'active' : 'inactive',
        image: apiProduct.image_url,
        description: apiProduct.description,
        created_at: apiProduct.created_at,
        updated_at: apiProduct.updated_at,
        cost_price: toNumber(apiProduct.cost_price),
        unit_of_measure: apiProduct.unit_of_measure,
        is_active: apiProduct.is_active,
      }));

      setProducts(mappedProducts);
    } else {
      setProducts([]);
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al cargar productos');
    setProducts([]);
  } finally {
    setLoading(false);
  }
};


  // Función para cargar categorías (una sola página del backend paginado)
  const loadCategories = async () => {
    try {
      const response = await categoryApi.getCategories(); // si acepta {page}, puedes enviarlo
      // El backend trae el array en data.data (paginado estilo Laravel)
      const pageObj = response?.data;
      const items = Array.isArray(pageObj?.data) ? pageObj.data : Array.isArray(response?.data) ? response.data : [];

      // Normaliza solo lo que necesitas
      const normalized: Category[] = items.map((c: any) => ({ id: c.id, name: c.name }));

      // (Opcional) deduplicar por id
      const unique = Array.from(new Map(normalized.map((c) => [c.id, c])).values());

      setCategories(unique);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  };

  // Función para subir imágenes de producto
  const uploadProductImages = async (productId: number, images: File[]) => {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/inventory/${productId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir imágenes');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      throw err;
    }
  };

  // Función para crear nueva categoría
  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    // Evitar duplicados por nombre (opcional)
    const exists = categories.some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
    if (exists) {
      alert('Ya existe una categoría con ese nombre.');
      return;
    }

    try {
      setCategorySubmitting(true);
      const response = await categoryApi.createCategory({ name });

      if (response?.success && response.data) {
        const newCat: Category = { id: response.data.id, name: response.data.name };
        setCategories((prev) => [...prev, newCat]);

        // Preseleccionar la categoría recién creada en el formulario de producto
        setPendingCategoryId(String(newCat.id));

        // Cerrar modal y limpiar
        setShowCategoryModal(false);
        setNewCategoryName('');
      }
    } catch (err) {
      console.error('Error creating category:', err);
    } finally {
      setCategorySubmitting(false);
    }
  };

  // CRUD Productos
  const createProduct = async (formData: ProductFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const createData: CreateProductData = {
        name: formData.name,
        sku: formData.sku,
        unit_price: formData.price,
        cost_price: formData.price * 0.7, // estimado
        stock_quantity: formData.stock,
        min_stock_level: formData.min_stock,
        unit_of_measure: 'unidad',
        is_active: formData.status === 'active',
        description: formData.description,
        category_id: formData.category ? parseInt(formData.category) : undefined,
      };

      const response = await productApi.createProduct(createData);

      if (response?.success && response.data) {
        // Si hay imágenes, subirlas
        if (formData.images && formData.images.length > 0) {
          await uploadProductImages(response.data.id, formData.images);
        }
        
        setModalMode(null);
        await loadProducts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto');
    } finally {
      setSubmitting(false);
    }
  };

  const updateProduct = async (id: number, formData: ProductFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const updateData: UpdateProductData = {
        name: formData.name,
        sku: formData.sku,
        unit_price: formData.price,
        stock_quantity: formData.stock,
        min_stock_level: formData.min_stock,
        is_active: formData.status === 'active',
        description: formData.description,
        category_id: formData.category ? parseInt(formData.category) : undefined,
      };

      const response = await productApi.updateProduct(id, updateData);

      if (response?.success) {
        setModalMode(null);
        await loadProducts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar producto');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      setSubmitting(true);
      setError(null);

      const response = await productApi.deleteProduct(id);

      if (response?.success) {
        setShowDeleteConfirm(null);
        await loadProducts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar producto');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStock = async (id: number, adjustment: number) => {
    try {
      setError(null);

      const response = await productApi.adjustStock(id, {
        quantity: adjustment,
        type: 'adjustment',
        notes: 'Ajuste manual de stock',
      });

      if (response?.success) {
        await loadProducts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar stock');
    }
  };

  // Recargar productos cuando cambien los filtros (si ya cargó inicialmente)
  useEffect(() => {
    if (!loading) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.category, filters.status]);

  // Filtrado en frontend (además del backend si usas query params)
  const filteredProducts = products.filter((product) => {
    const s = filters.search.trim().toLowerCase();
    const matchesSearch =
      !s ||
      product.name.toLowerCase().includes(s) ||
      product.sku.toLowerCase().includes(s) ||
      product.category.toLowerCase().includes(s);

    const matchesCategory =
      !filters.category || product.category_id?.toString() === filters.category;

    const matchesStatus =
      !filters.status ||
      (filters.status === 'active' && product.status === 'active') ||
      (filters.status === 'inactive' && product.status === 'inactive') ||
      (filters.status === 'low_stock' && product.stock <= product.min_stock);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // -----------------------
  // Modal para Crear/Editar
  // -----------------------
  const ProductModal: React.FC<{ pendingCategoryId: string | null }> = ({
    pendingCategoryId,
  }) => {
    const [formData, setFormData] = useState<ProductFormData>({
      name: '',
      sku: '',
      category: '',
      price: 0,
      stock: 0,
      min_stock: 0,
      status: 'active',
      description: '',
    });
    const [errors, setErrors] = useState<ProductFormErrors>({});

    useEffect(() => {
      if (modalMode === 'edit' && selectedProduct) {
        setFormData({
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          // ⚠️ usar ID de categoría
          category: selectedProduct.category_id?.toString() || '',
          price: selectedProduct.price,
          stock: selectedProduct.stock,
          min_stock: selectedProduct.min_stock,
          status: selectedProduct.status,
          description: selectedProduct.description || '',
        });
      } else if (modalMode === 'create') {
        setFormData({
          name: '',
          sku: '',
          category: '',
          price: 0,
          stock: 0,
          min_stock: 0,
          status: 'active',
          description: '',
        });
      }
      setErrors({});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalMode, selectedProduct]);

    // Cuando se crea una categoría desde el modal de categoría, preseleccionarla
    useEffect(() => {
      if (modalMode && modalMode !== 'view' && pendingCategoryId) {
        setFormData((prev) => ({ ...prev, category: pendingCategoryId }));
      }
    }, [pendingCategoryId, modalMode]);

    const validateForm = (): boolean => {
      const newErrors: ProductFormErrors = {};

      if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
      if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
      if (!formData.category.trim()) newErrors.category = 'La categoría es requerida';
      if (formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
      if (formData.stock < 0) newErrors.stock = 'El stock no puede ser negativo';
      if (formData.min_stock < 0)
        newErrors.min_stock = 'El stock mínimo no puede ser negativo';

      // Validar SKU único en frontend
      const existingSku = products.find(
        (p) =>
          p.sku.toLowerCase() === formData.sku.toLowerCase() &&
          (modalMode === 'create' || p.id !== selectedProduct?.id),
      );
      if (existingSku) newErrors.sku = 'El SKU ya existe';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) return;

      if (modalMode === 'create') {
        createProduct(formData);
      } else if (modalMode === 'edit' && selectedProduct) {
        updateProduct(selectedProduct.id, formData);
      }
    };

    const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof ProductFormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

    if (!modalMode) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {modalMode === 'create'
                ? 'Crear Producto'
                : modalMode === 'edit'
                ? 'Editar Producto'
                : 'Ver Producto'}
            </h2>
            <button
              onClick={() => {
                setModalMode(null);
                setSelectedProduct(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={modalMode === 'view'}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={modalMode === 'view'}
                />
                {errors.sku && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.sku}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={modalMode === 'view'}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {modalMode !== 'view' && (
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors"
                      title="Crear nueva categoría"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    handleInputChange('price', parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={modalMode === 'view'}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.price}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    handleInputChange('stock', parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={modalMode === 'view'}
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.stock}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) =>
                    handleInputChange('min_stock', parseInt(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.min_stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={modalMode === 'view'}
                />
                {errors.min_stock && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.min_stock}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange('status', e.target.value as 'active' | 'inactive')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={modalMode === 'view'}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={modalMode === 'view'}
              />
            </div>

            {modalMode !== 'view' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imágenes del Producto (Máximo 5)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 5) {
                        alert('Máximo 5 imágenes por producto');
                        return;
                      }
                      setFormData((prev) => ({ ...prev, images: files }));
                    }}
                    className="hidden"
                    id="product-images"
                  />
                  <label htmlFor="product-images" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Haz clic para seleccionar imágenes
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG, WEBP (máx. 5MB por imagen)
                      </p>
                    </div>
                  </label>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.images.length} imagen(es) seleccionada(s)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = formData.images?.filter((_, i) => i !== index);
                              setFormData((prev) => ({ ...prev, images: newImages }));
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {modalMode !== 'view' && (
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode(null);
                    setSelectedProduct(null);
                  }}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {submitting
                      ? modalMode === 'create'
                        ? 'Creando...'
                        : 'Guardando...'
                      : modalMode === 'create'
                      ? 'Crear'
                      : 'Guardar'}
                  </span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* Mostrar errores */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 mb-4">No hay productos registrados en el sistema.</p>
            <button
              onClick={() => setModalMode('create')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Producto</span>
            </button>
          </div>
        ) : (
          <ProductsDataTable
            data={products}
            onEdit={(product) => {
              setSelectedProduct(product);
              setModalMode('edit');
            }}
            onDelete={(id) => setShowDeleteConfirm(id)}
            onView={(product) => {
              setSelectedProduct(product);
              setModalMode('view');
            }}
            onImport={() => setShowImportModal(true)}
            onCreate={() => setModalMode('create')}
          />
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={submitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteProduct(showDeleteConfirm)}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : null}
                <span>{submitting ? 'Eliminando...' : 'Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Crear Categoría */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nueva Categoría</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la categoría *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ingresa el nombre de la categoría"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !categorySubmitting) {
                    createCategory();
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategoryName('');
                }}
                disabled={categorySubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={createCategory}
                disabled={categorySubmitting || !newCategoryName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {categorySubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : null}
                <span>{categorySubmitting ? 'Creando...' : 'Crear Categoría'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación */}
      <ProductImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={() => {
          loadProducts();
          setShowImportModal(false);
        }}
      />

      {/* Modal de Producto */}
      <ProductModal pendingCategoryId={pendingCategoryId} />
    </div>
  );
}
