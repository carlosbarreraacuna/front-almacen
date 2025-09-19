import Cookies from 'js-cookie';

// Configuración base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Función helper para hacer peticiones HTTP con autenticación
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = Cookies.get('auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'API request failed');
  }
  
  return result;
};

// Interfaces para los tipos de datos
export interface ApiProduct {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category_id?: number;
  brand_id?: number;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  unit_of_measure: string;
  weight?: number;
  dimensions?: any;
  image_url?: string;
  is_active: boolean;
  tax_rate?: number;
  supplier_id?: number;
  location_id?: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
    description?: string | null;
    logo_url?: string | null;
    website?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
  };
  location?: {
    id: number;
    name: string;
  };
}

export interface CreateProductData {
  name: string;
    description?: string;
    sku: string;
    barcode?: string;
    category_id?: number;
    brand_id?: number;
    unit_price: number;
    cost_price: number;
    stock_quantity: number;
  min_stock_level: number;
  max_stock_level?: number;
  unit_of_measure: string;
  weight?: number;
  image_url?: string;
  is_active?: boolean;
  tax_rate?: number;
  supplier_id?: number;
  location_id?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  brand_id?: number;
  low_stock?: boolean;
  out_of_stock?: boolean;
  per_page?: number;
  page?: number;
}

export interface StockAdjustment {
  quantity: number;
  type: 'adjustment' | 'damage' | 'loss';
  notes?: string;
}

// Servicios de API para productos
export const productApi = {
  // Obtener lista de productos
  getProducts: async (filters: ProductFilters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/inventory${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiRequest(endpoint);
  },

  // Obtener un producto específico
  getProduct: async (id: number) => {
    return await apiRequest(`/inventory/${id}`);
  },

  // Crear nuevo producto
  createProduct: async (productData: CreateProductData) => {
    return await apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Actualizar producto
  updateProduct: async (id: number, productData: UpdateProductData) => {
    return await apiRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Eliminar producto
  deleteProduct: async (id: number) => {
    return await apiRequest(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  // Ajustar stock
  adjustStock: async (id: number, adjustment: StockAdjustment) => {
    return await apiRequest(`/inventory/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify(adjustment),
    });
  },

  // Obtener movimientos de stock
  getStockMovements: async (id: number) => {
    return await apiRequest(`/inventory/${id}/stock-movements`);
  },

  // Obtener productos con stock bajo
  getLowStockProducts: async () => {
    return await apiRequest('/inventory/low-stock');
  },

  // Obtener productos sin stock
  getOutOfStockProducts: async () => {
    return await apiRequest('/inventory/out-of-stock');
  },

  // Obtener resumen de inventario
  getInventorySummary: async () => {
    return await apiRequest('/inventory/summary');
  },
};

// Servicios para categorías
export const categoryApi = {
  async getCategories(params?: { per_page?: number; query?: string; parent_id?: number; only_active?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.per_page) qs.set('per_page', String(params.per_page));
    if (params?.query) qs.set('query', params.query);
    if (params?.parent_id !== undefined) qs.set('parent_id', String(params.parent_id));
    if (params?.only_active) qs.set('only_active', '1');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/categories${suffix}`, { method: 'GET' });
  },
  async getCategory(id: number) {
    return apiRequest(`/categories/${id}`, { method: 'GET' });
  },
  async createCategory(data: any) {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateCategory(id: number, data: any) {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteCategory(id: number) {
    return apiRequest(`/categories/${id}`, { method: 'DELETE' });
  },
  async select() {
    return apiRequest('/categories/select', { method: 'GET' });
  },
  async tree() {
    return apiRequest('/categories/tree', { method: 'GET' });
  },
};


// Servicios para marcas
export const brandApi = {
  getBrands: async () => {
    return await apiRequest('/brands');
  },
  createBrand: async (brandData: { name: string }) => {
    return await apiRequest('/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  },
  updateBrand: async (id: number, brandData: { name: string }) => {
    return await apiRequest(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brandData),
    });
  },
  deleteBrand: async (id: number) => {
    return await apiRequest(`/brands/${id}`, {
      method: 'DELETE',
    });
  },
};

// Servicios para ubicaciones
export const locationApi = {
  getLocations: async () => {
    return await apiRequest('/locations');
  },
};

export default {
  productApi,
  categoryApi,
  brandApi,
  locationApi,
};