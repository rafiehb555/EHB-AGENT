import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface WishlistItem {
  id: string;
  productId: string;
  product: {
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
  };
  addedAt: string;
  notes?: string;
}

interface WishlistProps {
  userId: string;
}

const Wishlist: React.FC<WishlistProps> = ({ userId }) => {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [filter, setFilter] = useState('all'); // all, inStock, outOfStock

  useEffect(() => {
    loadWishlist();
  }, [userId]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/buyer/wishlist');
      const data = await response.json();

      if (data.success) {
        setWishlistItems(data.data.items);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch('/api/buyer/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();
      if (data.success) {
        setWishlistItems(wishlistItems.filter(item => item.productId !== productId));
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const addNote = async (productId: string, note: string) => {
    try {
      const response = await fetch('/api/buyer/wishlist/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId, note })
      });

      const data = await response.json();
      if (data.success) {
        setWishlistItems(wishlistItems.map(item =>
          item.productId === productId
            ? { ...item, notes: note }
            : item
        ));
        setShowNotes(null);
        setNoteText('');
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const toggleSelection = (productId: string) => {
    setSelectedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    setSelectedItems(wishlistItems.map(item => item.productId));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const removeSelected = async () => {
    try {
      const response = await fetch('/api/buyer/wishlist/bulk-remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds: selectedItems })
      });

      const data = await response.json();
      if (data.success) {
        setWishlistItems(wishlistItems.filter(item => !selectedItems.includes(item.productId)));
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Failed to remove selected items:', error);
    }
  };

  const compareSelected = () => {
    if (selectedItems.length >= 2 && selectedItems.length <= 5) {
      router.push(`/buyer/compare?products=${selectedItems.join(',')}`);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredItems = wishlistItems.filter(item => {
    if (filter === 'inStock') return item.product.inStock;
    if (filter === 'outOfStock') return !item.product.inStock;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">❤️ My Wishlist</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {wishlistItems.length} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Items ({wishlistItems.length})</option>
                <option value="inStock">In Stock ({wishlistItems.filter(item => item.product.inStock).length})</option>
                <option value="outOfStock">Out of Stock ({wishlistItems.filter(item => !item.product.inStock).length})</option>
              </select>

              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedItems.length} selected
                </span>
                <button
                  onClick={compareSelected}
                  disabled={selectedItems.length < 2 || selectedItems.length > 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  Compare ({selectedItems.length})
                </button>
                <button
                  onClick={removeSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Remove Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'Your wishlist is empty' : 'No items match your filter'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? 'Start adding products to your wishlist to see them here'
                : 'Try adjusting your filter or add more items to your wishlist'
              }
            </p>
            <button
              onClick={() => router.push('/buyer/home')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Selection Checkbox */}
                <div className="p-3 border-b">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.productId)}
                      onChange={() => toggleSelection(item.productId)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Select for comparison</span>
                  </label>
                </div>

                {/* Product Image */}
                <div className="relative">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-48 object-cover"
                  />

                  {/* SQL Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white shadow-sm ${getSqlBadge(item.product.sqlLevel).color}`}>
                      {getSqlBadge(item.product.sqlLevel).icon} {getSqlBadge(item.product.sqlLevel).label}
                    </span>
                  </div>

                  {/* Stock Status */}
                  {!item.product.inStock && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Added Date */}
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                      Added {formatDate(item.addedAt)}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.product.name}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.product.description}
                  </p>

                  {/* Seller Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-gray-500">{item.product.seller.name}</span>
                    {item.product.seller.verified && (
                      <span className="text-blue-500">✓</span>
                    )}
                    <div className="flex items-center">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm text-gray-500 ml-1">{item.product.seller.rating}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <div className="mb-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-gray-700">
                        <strong>Note:</strong> {item.notes}
                      </p>
                    </div>
                  )}

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(item.product.price, item.product.currency)}
                      </p>
                      <p className="text-sm text-gray-500">{item.product.location}</p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowNotes(item.productId)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        📝 Note
                      </button>
                      <button
                        onClick={() => router.push(`/buyer/product/${item.productId}`)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note Modal */}
        {showNotes && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h3>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a personal note about this item..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => addNote(showNotes, noteText)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Note
                </button>
                <button
                  onClick={() => {
                    setShowNotes(null);
                    setNoteText('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
