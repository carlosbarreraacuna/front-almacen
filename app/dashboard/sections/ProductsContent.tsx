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
  brandApi,
  ApiProduct,
  CreateProductData,
  UpdateProductData,
} from '../../services/api';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const STORAGE_BASE = API_BASE.replace(/\/api\/?$/, '');
import { ProductsDataTable } from '../../components/ProductsDataTable';
import { ProductImportModal } from '../../components/ProductImportModal';

interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  discount_percentage?: number;
  stock: number;
  min_stock: number;
  status: 'active' | 'inactive';
  image?: string;
  images?: ProductImage[];
  description?: string;
  compatible_models?: string;
  created_at?: string;
  updated_at?: string;
  cost_price?: number;
  unit_of_measure?: string;
  is_active?: boolean;
  category_id?: number;
  brand_id?: number;
  brand_name?: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  brand_id: string;
  price: number;
  discount_percentage: number;
  stock: number;
  min_stock: number;
  unit_of_measure: string;
  compatible_models: string;
  status: 'active' | 'inactive';
  description: string;
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
  compatible_models?: string;
}

interface ProductFilters {
  search: string;
  category: string; // ID de categoría (string) o ''
  status: string; // '', 'active', 'inactive', 'low_stock'
}

type ModalMode = 'create' | 'edit' | 'view' | null;

type Category = { id: number; name: string };
type Brand = { id: number; name: string };

export default function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

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
    loadBrands();
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
      per_page: 1000,
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
        discount_percentage: toNumber(apiProduct.discount_percentage),
        stock: toNumber(apiProduct.stock_quantity),
        min_stock: toNumber(apiProduct.min_stock_level),
        status: apiProduct.is_active ? 'active' : 'inactive',
        image: apiProduct.image_url,
        description: apiProduct.description,
        compatible_models: apiProduct.compatible_models,
        created_at: apiProduct.created_at,
        updated_at: apiProduct.updated_at,
        cost_price: toNumber(apiProduct.cost_price),
        unit_of_measure: apiProduct.unit_of_measure,
        is_active: apiProduct.is_active,
        brand_id: apiProduct.brand_id,
        brand_name: apiProduct.brand?.name,
        images: (apiProduct.images ?? []) as ProductImage[],
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


  const loadBrands = async () => {
    try {
      const response = await brandApi.getBrands();
      const pageObj = response?.data;
      const items = Array.isArray(pageObj?.data) ? pageObj.data : Array.isArray(response?.data) ? response.data : [];
      setBrands(items.map((b: any) => ({ id: b.id, name: b.name })));
    } catch (err) {
      console.error('Error loading brands:', err);
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
    const token = Cookies.get('auth_token');
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    const response = await fetch(`${API_BASE}/inventory/${productId}/images`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al subir imágenes');
    }
    return response.json();
  };

  // Función para eliminar imagen de producto
  const deleteProductImage = async (productId: number, imageId: number) => {
    await productApi.deleteProductImage(productId, imageId);
    await loadProducts();
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
        cost_price: formData.price,
        discount_percentage: formData.discount_percentage || 0,
        stock_quantity: formData.stock,
        min_stock_level: formData.min_stock,
        unit_of_measure: formData.unit_of_measure || 'unidad',
        is_active: formData.status === 'active',
        description: formData.description || undefined,
        compatible_models: formData.compatible_models || undefined,
        category_id: formData.category ? parseInt(formData.category) : undefined,
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : undefined,
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
        cost_price: formData.price,
        discount_percentage: formData.discount_percentage || 0,
        stock_quantity: formData.stock,
        min_stock_level: formData.min_stock,
        unit_of_measure: formData.unit_of_measure || 'unidad',
        is_active: formData.status === 'active',
        description: formData.description || undefined,
        compatible_models: formData.compatible_models || undefined,
        category_id: formData.category ? parseInt(formData.category) : undefined,
        brand_id: formData.brand_id ? parseInt(formData.brand_id) : undefined,
      };

      const response = await productApi.updateProduct(id, updateData);

      if (response?.success) {
        if (formData.images && formData.images.length > 0) {
          await uploadProductImages(id, formData.images);
        }
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
    const emptyForm: ProductFormData = {
      name: '',
      sku: '',
      category: '',
      brand_id: '',
      price: 0,
      discount_percentage: 0,
      stock: 0,
      min_stock: 0,
      unit_of_measure: '',
      compatible_models: '',
      status: 'active',
      description: '',
    };

    const [formData, setFormData] = useState<ProductFormData>(emptyForm);
    const [errors, setErrors] = useState<ProductFormErrors>({});

    useEffect(() => {
      if (modalMode === 'edit' && selectedProduct) {
        setFormData({
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          category: selectedProduct.category_id?.toString() || '',
          brand_id: selectedProduct.brand_id?.toString() || '',
          price: selectedProduct.price,
          discount_percentage: selectedProduct.discount_percentage ?? 0,
          stock: selectedProduct.stock,
          min_stock: selectedProduct.min_stock,
          unit_of_measure: selectedProduct.unit_of_measure || '',
          compatible_models: selectedProduct.compatible_models || '',
          status: selectedProduct.status,
          description: selectedProduct.description || '',
        });
      } else if (modalMode === 'create') {
        setFormData(emptyForm);
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
        <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
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
            {/* Nombre + SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input type="text" value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={modalMode === 'view'} />
                {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (SKU) *</label>
                <input type="text" value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={modalMode === 'view'} />
                {errors.sku && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.sku}</p>}
              </div>
            </div>

            {/* Categoría + Marca */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <div className="flex gap-2">
                  <select value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                    disabled={modalMode === 'view'}>
                    <option value="">Seleccionar categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                  </select>
                  {modalMode !== 'view' && (
                    <button type="button" onClick={() => setShowCategoryModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" title="Nueva categoría">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errors.category && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <select value={formData.brand_id}
                  onChange={(e) => handleInputChange('brand_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={modalMode === 'view'}>
                  <option value="">Seleccionar marca</option>
                  {brands.map((b) => <option key={b.id} value={b.id.toString()}>{b.name}</option>)}
                </select>
              </div>
            </div>

            {/* Precio + Descuento + Presentación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                <input type="number" step="0.01" min="0" value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={modalMode === 'view'} />
                {errors.price && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                <input type="number" step="1" min="0" max="100" value={formData.discount_percentage}
                  onChange={(e) => handleInputChange('discount_percentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={modalMode === 'view'} />
                {formData.discount_percentage > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Precio oferta: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(
                      Math.round(formData.price * (1 - formData.discount_percentage / 100))
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
                <input type="text" value={formData.unit_of_measure}
                  onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                  placeholder="Ej: CAJA X10, unidad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={modalMode === 'view'} />
              </div>
            </div>

            {/* Stock + Stock Mínimo + Estado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                <input type="number" min="0" value={formData.stock}
                  onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={modalMode === 'view'} />
                {errors.stock && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.stock}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
                <input type="number" min="0" value={formData.min_stock}
                  onChange={(e) => handleInputChange('min_stock', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.min_stock ? 'border-red-500' : 'border-gray-300'}`}
                  disabled={modalMode === 'view'} />
                {errors.min_stock && <p className="text-red-500 text-sm mt-1 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.min_stock}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={modalMode === 'view'}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            {/* Modelos Compatibles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelos Compatibles</label>
              <textarea value={formData.compatible_models}
                onChange={(e) => handleInputChange('compatible_models', e.target.value)}
                rows={2} placeholder="Ej: BM100 / PULSAR 180 / BOXER 100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={modalMode === 'view'} />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={modalMode === 'view'} />
            </div>

            {/* Imágenes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del Producto
              </label>

              {/* Imágenes existentes (modo editar/ver) */}
              {selectedProduct?.images && selectedProduct.images.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Imágenes guardadas:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {selectedProduct.images
                      .slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((img) => {
                        const src = img.image_url.startsWith('http')
                          ? img.image_url
                          : `${STORAGE_BASE}${img.image_url}`;
                        return (
                          <div key={img.id} className="relative group">
                            <img
                              src={src}
                              alt="Imagen producto"
                              className="w-full h-20 object-cover rounded-lg border border-gray-200"
                            />
                            {img.is_primary && (
                              <span className="absolute bottom-0 left-0 right-0 text-center bg-blue-600 text-white text-[10px] py-0.5 rounded-b-lg">
                                Principal
                              </span>
                            )}
                            {modalMode !== 'view' && (
                              <button
                                type="button"
                                onClick={() => deleteProductImage(selectedProduct.id, img.id)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar imagen"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Subir nuevas imágenes */}
              {modalMode !== 'view' && (
                <>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const existing = selectedProduct?.images?.length ?? 0;
                        if (existing + files.length > 5) {
                          alert(`Solo puedes tener 5 imágenes. Ya tienes ${existing}.`);
                          return;
                        }
                        setFormData((prev) => ({ ...prev, images: files }));
                      }}
                      className="hidden"
                      id="product-images"
                    />
                    <label htmlFor="product-images" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Haz clic para agregar imágenes</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · máx. 5MB · hasta 5 por producto</p>
                    </label>
                  </div>

                  {/* Preview de nuevas imágenes seleccionadas */}
                  {formData.images && formData.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">{formData.images.length} imagen(es) nuevas a subir:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {formData.images.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Nueva ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-blue-200"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  images: prev.images?.filter((_, i) => i !== index),
                                }))
                              }
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

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
        ) : (
          <ProductsDataTable
            data={filteredProducts}
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
