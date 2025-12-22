import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const PLACEHOLDER_IMAGE = "https://placehold.co/400x300?text=No+Image";

const WishlistPage = () => {
  const { wishlist, toggleWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // ✅ POPUP STATE
  const [showClearPopup, setShowClearPopup] = useState(false);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
  };

  const handleClearConfirm = () => {
    clearWishlist();
    setShowClearPopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">
            Wishlist ({wishlist.length})
          </h1>

          {wishlist.length > 0 && (
            <button
              onClick={() => setShowClearPopup(true)}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Clear All
            </button>
          )}
        </div>

        {/* EMPTY STATE */}
        {wishlist.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <p className="text-gray-600 mb-4">Your wishlist is empty</p>
            <button
              onClick={() => navigate("/e-market")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-4">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition flex flex-col"
              >
                {/* IMAGE */}
                <div className="relative h-52 flex items-center justify-center">
                  <img
                    src={product.image || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                  />

                  {/* REMOVE SINGLE */}
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>

                {/* INFO */}
                <div className="p-2 flex flex-col flex-grow">
                  <h3 className="text-sm font-medium line-clamp-2 h-8 mb-1">
                    {product.name}
                  </h3>

                  <span className="text-base font-semibold text-red-600 mb-2">
                    ₹ {Number(product.price || 0).toFixed(2)}
                  </span>

                  <div className="mt-auto space-y-1.5">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
                    >
                      Add to Cart
                    </button>

                    <button
                      onClick={() => {
                        handleAddToCart(product);
                        navigate("/checkout");
                      }}
                      className="w-full py-1.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition text-sm"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ CLEAR ALL CONFIRM POPUP */}
      {showClearPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Clear Wishlist?
            </h2>
            <p className="text-gray-600 mb-5">
              Are you sure you want to remove all items from your wishlist?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearPopup(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClearConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WishlistPage;
