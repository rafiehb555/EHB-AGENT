import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  sqlLevel: 'basic' | 'normal' | 'high' | 'vip';
  category: string;
  seller: {
    id: string;
    name: string;
    location: string;
    verified: boolean;
    rating: number;
  };
  location: string;
  inStock: boolean;
  deliveryTime: string;
  images: string[];
  tags: string[];
  createdAt: string;
}

interface SearchFilters {
  category: string;
  sqlLevel: string;
  location: string;
  verifiedOnly: boolean;
  inStockOnly: boolean;
  priceRange: {
    min: number;
    max: number;
  };
}

interface BuyerHomeProps {
  userLocation?: string;
  userLanguage?: string;
  userCurrency?: string;
}

const BuyerHome: React.FC<BuyerHomeProps> = ({
  userLocation = 'Lahore, Pakistan',
  userLanguage = 'en',
  userCurrency = 'PKR'
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    sqlLevel: '',
    location: '',
    verifiedOnly: false,
    inStockOnly: true,
    priceRange: { min: 0, max: 100000 }
  });
  const [selectedLanguage, setSelectedLanguage] = useState(userLanguage);
  const [selectedCurrency, setSelectedCurrency] = useState(userCurrency);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Translations
  const translations = {
    en: {
      searchPlaceholder: 'Search for products, services, or sellers...',
      filters: 'Filters',
      categories: 'Categories',
      sqlLevels: 'SQL Levels',
      locations: 'Locations',
      verifiedOnly: 'Verified Only',
      inStockOnly: 'In Stock Only',
      priceRange: 'Price Range',
      featured: 'Featured',
      topProducts: 'Top Verified Products',
      newListings: 'New Listings',
      bestOffers: 'Best Offers',
      recentlySearched: 'Recently Searched',
      addToWishlist: 'Add to Wishlist',
      removeFromWishlist: 'Remove from Wishlist',
      compare: 'Compare',
      viewDetails: 'View Details',
      noResults: 'No products found',
      loading: 'Loading products...'
    },
    ur: {
      searchPlaceholder: 'پروڈکٹس، خدمات، یا فروخت کنندگان تلاش کریں...',
      filters: 'فلٹرز',
      categories: 'زمرے',
      sqlLevels: 'SQL لیولز',
      locations: 'مقامات',
      verifiedOnly: 'صرف تصدیق شدہ',
      inStockOnly: 'صرف دستیاب',
      priceRange: 'قیمت کی حد',
      featured: 'نمایاں',
      topProducts: 'بہترین تصدیق شدہ پروڈکٹس',
      newListings: 'نئی فہرستیں',
      bestOffers: 'بہترین آفرز',
      recentlySearched: 'حال ہی میں تلاش شدہ',
      addToWishlist: 'خواہش کی فہرست میں شامل کریں',
      removeFromWishlist: 'خواہش کی فہرست سے ہٹائیں',
      compare: 'موازنہ',
      viewDetails: 'تفصیلات دیکھیں',
      noResults: 'کوئی پروڈکٹ نہیں ملا',
      loading: 'پروڈکٹس لوڈ ہو رہی ہیں...'
    }
  };

  const t = translations[selectedLanguage as keyof typeof translations] || translations.en;

  useEffect(() => {
    loadProducts();
    loadWishlist();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters, searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          location: userLocation,
          language: selectedLanguage,
          currency: selectedCurrency
        })
      });

      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const response = await fetch('/api/buyer/wishlist');
      const data = await response.json();
      if (data.success) {
        setWishlist(data.data.productIds);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // SQL level filter
    if (filters.sqlLevel) {
      filtered = filtered.filter(product => product.sqlLevel === filters.sqlLevel);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(product =>
        product.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Verified only filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(product => product.seller.verified);
    }

    // In stock only filter
    if (filters.inStockOnly) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= filters.priceRange.min &&
      product.price <= filters.priceRange.max
    );

    setFilteredProducts(filtered);
  };

  const toggleWishlist = async (productId: string) => {
    try {
      const isInWishlist = wishlist.includes(productId);
      const response = await fetch('/api/buyer/wishlist', {
        method: isInWishlist ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();
      if (data.success) {
        if (isInWishlist) {
          setWishlist(wishlist.filter(id => id !== productId));
        } else {
          setWishlist([...wishlist, productId]);
        }
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  const getSqlBadge = (sqlLevel: string) => {
    const badges = {
      basic: { icon: '🟢', color: 'text-green-500', label: 'Basic' },
      normal: { icon: '🔵', color: 'text-blue-500', label: 'Normal' },
      high: { icon: '🟣', color: 'text-purple-500', label: 'High' },
      vip: { icon: '🟡', color: 'text-yellow-500', label: 'VIP' }
    };
    return badges[sqlLevel as keyof typeof badges] || badges.basic;
  };

  const formatPrice = (price: number, currency: string) => {
    const exchangeRates = {
      PKR: 1,
      USD: 0.0036,
      EUR: 0.0033,
      AED: 0.013
    };

    const convertedPrice = price * (exchangeRates[currency as keyof typeof exchangeRates] || 1);

    return new Intl.NumberFormat(selectedLanguage, {
      style: 'currency',
      currency: selectedCurrency
    }).format(convertedPrice);
  };

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Automotive', 'Health & Beauty', 'Toys', 'Food & Beverages'
  ];

  const sqlLevels = [
    { value: 'basic', label: 'Basic', icon: '🟢' },
    { value: 'normal', label: 'Normal', icon: '🔵' },
    { value: 'high', label: 'High', icon: '🟣' },
    { value: 'vip', label: 'VIP', icon: '🟡' }
  ];

  const locations = [
    'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🛒 GoSellr Buyer Portal</h1>

              {/* Language & Currency Selector */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="ur">🇵🇰 اردو</option>
                  <option value="ar">🇸🇦 العربية</option>
                  <option value="hi">🇮🇳 हिंदी</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="zh">🇨🇳 中文</option>
                </select>

                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="PKR">🇵🇰 PKR</option>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="EUR">🇪🇺 EUR</option>
                  <option value="AED">🇦🇪 AED</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/buyer/wishlist')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                ❤️ Wishlist ({wishlist.length})
              </button>
              <button
                onClick={() => router.push('/buyer/compare')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                ⚖️ Compare
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.filters} {showFilters ? '▲' : '▼'}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.categories}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* SQL Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.sqlLevels}
                </label>
                <select
                  value={filters.sqlLevel}
                  onChange={(e) => setFilters({...filters, sqlLevel: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All SQL Levels</option>
                  {sqlLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.icon} {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.locations}
                </label>
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({...filters, verifiedOnly: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t.verifiedOnly}</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) => setFilters({...filters, inStockOnly: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t.inStockOnly}</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Sections */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.featured}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⭐ {t.topProducts}</h3>
              <div className="space-y-2">
                {filteredProducts
                  .filter(p => p.seller.verified && p.sqlLevel === 'vip')
                  .slice(0, 3)
                  .map(product => (
                    <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{formatPrice(product.price, product.currency)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* New Listings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🛒 {t.newListings}</h3>
              <div className="space-y-2">
                {filteredProducts
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 3)
                  .map(product => (
                    <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{formatPrice(product.price, product.currency)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Best Offers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ {t.bestOffers}</h3>
              <div className="space-y-2">
                {filteredProducts
                  .filter(p => p.inStock)
                  .sort((a, b) => a.price - b.price)
                  .slice(0, 3)
                  .map(product => (
                    <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-red-600 font-bold">{formatPrice(product.price, product.currency)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? t.loading : `${filteredProducts.length} Products Found`}
            </h2>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option>Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
                <option>Rating</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">{t.loading}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noResults}</h3>
              <p className="text-gray-500">Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />

                    {/* SQL Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white shadow-sm ${getSqlBadge(product.sqlLevel).color}`}>
                        {getSqlBadge(product.sqlLevel).icon} {getSqlBadge(product.sqlLevel).label}
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
                    >
                      {wishlist.includes(product.id) ? '❤️' : '🤍'}
                    </button>

                    {/* Stock Status */}
                    {!product.inStock && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Seller Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-gray-500">{product.seller.name}</span>
                      {product.seller.verified && (
                        <span className="text-blue-500">✓</span>
                      )}
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm text-gray-500 ml-1">{product.seller.rating}</span>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(product.price, product.currency)}
                        </p>
                        <p className="text-sm text-gray-500">{product.location}</p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/buyer/product/${product.id}`)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          {t.viewDetails}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerHome;
