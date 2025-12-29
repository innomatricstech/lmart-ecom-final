import React from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const PLACEHOLDER_IMAGE = "https://placehold.co/400x300?text=No+Image";

/* ⭐ STAR RATING */
const StarRating = ({ rating = 0, size = "w-4 h-4" }) => {
  const fullStars = Math.floor(rating);

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`${size} ${i < fullStars ? "text-yellow-400" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

/* 🛒 PRODUCT CARD */
const WishlistProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart, items } = useCart();

  const rating = product.rating || 4.3;
  const reviewCount = product.reviewCount || 0;
  const finalPrice = product.price;
  const original = product.originalPrice || 0;
  const discount = product.discount || 0;

  const qty = items.find((i) => i.id === product.id)?.quantity || 0;

  // ✅ FIXED
  const inWishlist = wishlist.some((item) => item.id === product.id);

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({ ...product, quantity: 1 });
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition
             cursor-pointer flex flex-col  w-[250px]"
  onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
>
  {/* IMAGE */}
  <div className="relative flex items-center justify-center bg-white p-3 h-48 sm:h-56">
    <img
      src={product.image || PLACEHOLDER_IMAGE}
      alt={product.name}
      className="object-contain w-full h-full scale-110 sm:scale-100"
      onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
    />

    {/* ❤️ WISHLIST */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleWishlistToggle(e);
      }}
      className={`absolute top-3 right-3 p-2 bg-white rounded-full shadow-md
        hover:scale-110 transition
        ${inWishlist ? "text-red-600" : "text-red-400"}`}
    >
      X
    </button>

    {/* DISCOUNT */}
    {discount > 0 && (
      <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded">
        -{discount}%
      </span>
    )}
  </div>

  {/* CONTENT */}
  <div className="px-2 sm:px-4 pb-3 flex flex-col">
    <h3 className="font-medium text-xs sm:text-base leading-tight line-clamp-2">
      {product.name}
    </h3>

    {/* RATING */}
    <div className="flex items-center mt-0.5">
      <span className="text-[11px] sm:text-sm font-medium text-yellow-500 mr-1">
        {rating.toFixed(1)}
      </span>
      <StarRating rating={rating} size="w-3 h-3 sm:w-4 sm:h-4" />
      <span className="text-[11px] text-gray-500 ml-1">
        ({reviewCount})
      </span>
    </div>

    {/* PRICE */}
    <div className="flex items-center gap-1 mt-0.5">
      {original > finalPrice ? (
        <>
          <span className="text-red-600 font-semibold text-sm sm:text-lg">
            ₹ {finalPrice}
          </span>
          <span className="line-through text-gray-500 text-xs sm:text-base">
            ₹ {original}
          </span>
        </>
      ) : (
        <span className="text-gray-900 font-bold text-sm sm:text-lg">
          ₹ {finalPrice}
        </span>
      )}
    </div>

    {/* ADD TO CART */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleAddToCart(e);
      }}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white
                 py-1.5 sm:py-2 rounded-md font-medium
                 text-xs sm:text-base mt-2"
    >
      Add to Cart
    </button>

    {/* BUY NOW */}
     
  </div>
</div>

  );
};

/* 📦 MAIN PAGE */
const WishlistPage = () => {
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4 py-4">
      {wishlist.length === 0 ? (
        <div className="bg-white border rounded-lg shadow-sm text-center py-10 text-gray-500 max-w-md mx-auto">
          Your wishlist is empty
          <div className="mt-4">
            <button
              onClick={() => navigate("/e-market")}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg"
            >
              Start Shopping
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          {wishlist.map((product) => (
            <WishlistProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
