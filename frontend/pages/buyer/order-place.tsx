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
    sqlLevel: string;
  };
  location: string;
  inStock: boolean;
  deliveryTime: string;
  images: string[];
  stock: number;
}

interface OrderPlacementProps {
  productId: string;
  userId: string;
  walletAddress: string;
}

const OrderPlacement: React.FC<OrderPlacementProps> = ({
  productId,
  userId,
  walletAddress
}) => {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: ''
  });
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    loadProduct();
    loadWalletBalance();
  }, [productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const response = await fetch(`/api/wallet/balance?address=${walletAddress}`);
      const data = await response.json();

      if (data.success) {
        setWalletBalance(data.data.balance);
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
  };

  const calculateTotal = () => {
    if (!product) return 0;
    return product.price * quantity;
  };

  const calculateCommission = () => {
    const total = calculateTotal();
    const commissionRates = {
      basic: { seller: 0.85, platform: 0.10, franchise: 0.05 },
      normal: { seller: 0.80, platform: 0.12, franchise: 0.08 },
      high: { seller: 0.75, platform: 0.15, franchise: 0.10 },
      vip: { seller: 0.70, platform: 0.18, franchise: 0.12 }
    };

    const rates = commissionRates[product?.sqlLevel || 'normal'];
    return {
      seller: total * rates.seller,
      platform: total * rates.platform,
      franchise: total * rates.franchise,
      total: total
    };
  };

  const placeOrder = async () => {
    if (!product || !deliveryAddress.street || !deliveryAddress.city) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          buyer: {
            userId,
            walletAddress,
            name: 'Buyer Name', // In production, get from user profile
            email: 'buyer@example.com',
            phone: '+92-300-1234567',
            location: 'Lahore, Pakistan'
          },
          productId: product.id,
          quantity,
          deliveryAddress,
          deliveryMethod,
          paymentMethod
        })
      });

      const data = await response.json();
      if (data.success) {
        setOrderId(data.data.orderId);
        setOrderPlaced(true);
      } else {
        alert('Failed to place order: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!orderId) return;

    setPaymentProcessing(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          paymentMethod
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Payment processed successfully!');
        router.push(`/buyer/order/${orderId}`);
      } else {
        alert('Payment failed: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Payment processing failed');
    } finally {
      setPaymentProcessing(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-500 mb-6">The product you're looking for doesn't exist</p>
          <button
            onClick={() => router.push('/buyer/home')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const commission = calculateCommission();
  const canAfford = walletBalance >= total;

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
              <h1 className="text-2xl font-bold text-gray-900">💳 Place Order</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Wallet Balance: {formatPrice(walletBalance, 'PKR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(product.price, product.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">SQL Level:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSqlBadge(product.sqlLevel).color}`}>
                  {getSqlBadge(product.sqlLevel).icon} {getSqlBadge(product.sqlLevel).label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Seller:</span>
                <span className="text-sm text-gray-900">{product.seller.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="text-sm text-gray-900">{product.location}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stock:</span>
                <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                  {product.inStock ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

            <div className="space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 bg-gray-100 rounded min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={deliveryAddress.street}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={deliveryAddress.city}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={deliveryAddress.state}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Country"
                      value={deliveryAddress.country}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, country: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={deliveryAddress.postalCode}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, postalCode: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Method
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="standard">Standard (3-5 days)</option>
                  <option value="express">Express (1-2 days)</option>
                  <option value="same_day">Same Day</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="wallet">Wallet Payment</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Product Price:</span>
              <span className="text-gray-900">{formatPrice(product.price, product.currency)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="text-gray-900">{quantity}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">{formatPrice(total, product.currency)}</span>
            </div>

            <hr className="my-3" />

            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">Total:</span>
              <span className="text-blue-600">{formatPrice(total, product.currency)}</span>
            </div>

            {/* Commission Breakdown */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Commission Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller ({commission.seller / total * 100}%):</span>
                  <span className="text-green-600">{formatPrice(commission.seller, product.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform ({commission.platform / total * 100}%):</span>
                  <span className="text-blue-600">{formatPrice(commission.platform, product.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Franchise ({commission.franchise / total * 100}%):</span>
                  <span className="text-purple-600">{formatPrice(commission.franchise, product.currency)}</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance Check */}
            <div className={`mt-4 p-4 rounded-lg ${canAfford ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Wallet Balance:</span>
                <span className={`text-sm font-medium ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(walletBalance, 'PKR')}
                </span>
              </div>
              {!canAfford && (
                <p className="text-sm text-red-600 mt-1">
                  Insufficient balance. You need {formatPrice(total - walletBalance, 'PKR')} more.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            {!orderPlaced ? (
              <button
                onClick={placeOrder}
                disabled={loading || !canAfford || !deliveryAddress.street || !deliveryAddress.city}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            ) : (
              <button
                onClick={processPayment}
                disabled={paymentProcessing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {paymentProcessing ? 'Processing Payment...' : 'Pay Now'}
              </button>
            )}

            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          {orderPlaced && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm text-green-700">
                  Order placed successfully! Order ID: {orderId}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPlacement;
