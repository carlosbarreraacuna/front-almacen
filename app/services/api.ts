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
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.errors?.[0] || errorBody?.message || `Error ${response.status}`;
    throw new Error(message);
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
  compatible_models?: string;
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
  images?: { id: number; image_url: string; is_primary: boolean; sort_order: number }[];
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
  compatible_models?: string;
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

  // Eliminar imagen de producto
  deleteProductImage: async (productId: number, imageId: number) => {
    return await apiRequest(`/inventory/${productId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },

  // Importar productos desde Excel
  importProducts: async (file: File) => {
    const token = Cookies.get('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/inventory/import`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al importar productos');
    }

    return await response.json();
  },

  // Descargar plantilla de importación
  getImportTemplate: async () => {
    return await apiRequest('/inventory/import/template');
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

// ── Tipos de ventas ────────────────────────────────────────────────────────────

export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
}

export interface CreateSaleData {
  customer_id?: number;
  items: SaleItem[];
  payment_method: 'cash' | 'card' | 'transfer' | 'check' | 'credit';
  subtotal: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  notes?: string;
}

export interface SaleFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  payment_method?: string;
  per_page?: number;
}

export const saleApi = {
  getSales: async (filters: SaleFilters = {}) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return await apiRequest(`/sales?${qs.toString()}`);
  },

  createSale: async (data: CreateSaleData) => {
    return await apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSale: async (id: number) => {
    return await apiRequest(`/sales/${id}`);
  },

  cancelSale: async (id: number) => {
    return await apiRequest(`/sales/${id}/cancel`, { method: 'PATCH' });
  },

  deleteSale: async (id: number) => {
    return await apiRequest(`/sales/${id}`, { method: 'DELETE' });
  },

  getStats: async (dateFrom?: string, dateTo?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.append('date_from', dateFrom);
    if (dateTo)   qs.append('date_to',   dateTo);
    return await apiRequest(`/sales/stats?${qs.toString()}`);
  },
};

// ── Tipos de clientes ──────────────────────────────────────────────────────────

export interface ApiCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  customer_type?: 'individual' | 'business' | 'wholesale' | 'retail';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  credit_limit?: number;
  payment_terms?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  sales_count?: number;
  total_sales_amount?: number;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  customer_type?: 'individual' | 'business' | 'wholesale' | 'retail';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  credit_limit?: number;
  payment_terms?: string;
  notes?: string;
}

export const customerApi = {
  getCustomers: async (params: { search?: string; customer_type?: string; is_active?: boolean; per_page?: number } = {}) => {
    const qs = new URLSearchParams();
    qs.set('per_page', String(params.per_page ?? 100));
    if (params.search) qs.set('search', params.search);
    if (params.customer_type) qs.set('customer_type', params.customer_type);
    if (params.is_active !== undefined) qs.set('is_active', params.is_active ? '1' : '0');
    return await apiRequest(`/customers?${qs.toString()}`);
  },

  getCustomer: async (id: number) => {
    return await apiRequest(`/customers/${id}`);
  },

  createCustomer: async (data: CreateCustomerData) => {
    return await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCustomer: async (id: number, data: Partial<CreateCustomerData> & { is_active?: boolean }) => {
    return await apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCustomer: async (id: number) => {
    return await apiRequest(`/customers/${id}`, { method: 'DELETE' });
  },

  toggleStatus: async (id: number) => {
    return await apiRequest(`/customers/${id}/toggle-status`, { method: 'PATCH' });
  },

  getCustomerSales: async (id: number, page = 1) => {
    return await apiRequest(`/customers/${id}/sales?per_page=10&page=${page}`);
  },
};

// ── Dashboard API ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  getSummary: (dateFrom?: string, dateTo?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    return apiRequest(`/dashboard/summary?${qs.toString()}`);
  },
  getSalesTrend: (dateFrom?: string, dateTo?: string, groupBy?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    if (groupBy)  qs.set('group_by',  groupBy);
    return apiRequest(`/dashboard/sales-trend?${qs.toString()}`);
  },
  getTopProducts: (dateFrom?: string, dateTo?: string, limit = 10) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    qs.set('limit', String(limit));
    return apiRequest(`/dashboard/top-products?${qs.toString()}`);
  },
  getTopCustomers: (dateFrom?: string, dateTo?: string, limit = 10) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    qs.set('limit', String(limit));
    return apiRequest(`/dashboard/top-customers?${qs.toString()}`);
  },
  getHourly: (dateFrom?: string, dateTo?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    return apiRequest(`/dashboard/hourly?${qs.toString()}`);
  },
  getByCategory: (dateFrom?: string, dateTo?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    return apiRequest(`/dashboard/by-category?${qs.toString()}`);
  },
  getInventoryHealth: (dateFrom?: string, dateTo?: string) => {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('date_from', dateFrom);
    if (dateTo)   qs.set('date_to',   dateTo);
    return apiRequest(`/dashboard/inventory-health?${qs.toString()}`);
  },
};

export const couponApi = {
  validate: async (code: string, orderTotal: number, productIds: number[] = []) => {
    return apiRequest('/tienda/cupones/validar', {
      method: 'POST',
      body: JSON.stringify({ code, order_total: orderTotal, product_ids: productIds }),
    });
  },
};

export default {
  productApi,
  categoryApi,
  brandApi,
  locationApi,
  saleApi,
  customerApi,
  couponApi,
  dashboardApi,
};