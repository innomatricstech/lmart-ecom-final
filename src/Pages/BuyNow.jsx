import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingBag, Truck, Shield, RefreshCw } from "lucide-react";

const BuyNow = () => {
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("buyNowItem");
    if (!stored) {
      navigate("/");
      return;
    }
    setItem(JSON.parse(stored));
  }, [navigate]);

  if (!item) return null;

  const total = item.price * item.quantity;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Header */}
        <div className="mb-6">
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <ChevronLeft size={20} />
            <span>Back to Shopping</span>
          </button> */}
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-1">
            <span className="font-semibold">1 item</span> in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT – Cart Items & Summary */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Selected Items Summary */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Selected: 1 item</h2>
                <span className="text-xl font-bold text-gray-900">Total: ₹{total}</span>
              </div>
              
              <button
                onClick={() =>
                  navigate("/checkout", {
                    state: { buyNow: true, item }
                  })
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg"
              >
                <ShoppingBag size={20} />
                Checkout Now
              </button>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">Select</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Product</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Price</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Quantity</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-4">
                        <input type="checkbox" checked readOnly className="w-5 h-5 text-green-600 rounded" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 object-contain bg-white rounded-lg border p-2"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">No description available.</p>
                            <div className="mt-3 space-y-1">
                              {item.selectedColor && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Color:</span>
                                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    {item.selectedColor}
                                  </span>
                                </div>
                              )}
                              {item.selectedSize && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">Size:</span>
                                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                                    {item.selectedSize}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">
                            -
                          </button>
                          <span className="font-semibold">{item.quantity}</span>
                          <button className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100">
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg">
                            <RefreshCw size={18} />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-4 flex flex-col items-center text-center">
                <Truck className="text-green-600 mb-2" size={24} />
                <span className="font-semibold text-sm">Free Shipping</span>
                <span className="text-xs text-gray-500">On all orders</span>
              </div>
              <div className="bg-white rounded-xl border p-4 flex flex-col items-center text-center">
                <Shield className="text-green-600 mb-2" size={24} />
                <span className="font-semibold text-sm">Secure Payment</span>
                <span className="text-xs text-gray-500">100% Protected</span>
              </div>
              <div className="bg-white rounded-xl border p-4 flex flex-col items-center text-center">
                <svg className="w-6 h-6 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold text-sm">Easy Returns</span>
                <span className="text-xs text-gray-500">30 Day Policy</span>
              </div>
            </div>
          </div>

          {/* RIGHT – Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-6 pb-3 border-b">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal (1 items)</span>
                  <span className="font-semibold">₹{total}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600 font-semibold">FREE</span>
                </div>

                <hr className="my-2" />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-2xl">₹{total}.00</span>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Selected Items 1 items:</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-gray-900">₹{total}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate("/checkout", {
                    state: { buyNow: true, item }
                  })
                }
                className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-lg font-bold transition-all duration-200 hover:shadow-lg"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => navigate(-1)}
                className="w-full mt-4 bg-gray-900 hover:bg-black text-white py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Continue Shopping
              </button>
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyNow;