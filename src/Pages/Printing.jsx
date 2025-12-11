// pages/Printing.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

/* --------------------- Firebase init --------------------- */
const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : {};

const appName = typeof __app_id !== "undefined" && __app_id ? `print-${__app_id}` : "[DEFAULT]";
const app = getApps().find((a) => a.name === appName) || initializeApp(firebaseConfig, appName);
const db = getFirestore(app);

/* --------------------- Helpers --------------------- */
const PLACEHOLDER_IMAGE = "https://placehold.co/400x300?text=No+Image";

const getMainImageUrl = (product) => {
  if (product.mainImageUrl) return product.mainImageUrl;
  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    const main = product.imageUrls.find((i) => i.isMain) || product.imageUrls[0];
    return main?.url || PLACEHOLDER_IMAGE;
  }
  return product.image || product.imageUrl || PLACEHOLDER_IMAGE;
};

const pickVariant = (product) => {
  if (!Array.isArray(product.variants)) return null;
  return product.variants.find(v => Number(v.price) > 0) || product.variants[0] || null;
};

const getPriceData = (product) => {
  const variant = pickVariant(product);
  const price = variant ? Number(variant.price || 0) : Number(product.price || 0);
  const offer = variant?.offerPrice ? Number(variant.offerPrice) : 0;

  const finalPrice = offer && offer < price ? offer : price;
  const original = offer && offer < price ? price : 0;

  const discount = original > 0 ? Math.round(((original - finalPrice) / original) * 100) : 0;

  return { finalPrice, original, discount, variant };
};

const keywordMatches = (text, query) => {
  if (!text || !query) return false;
  return String(text).toLowerCase().includes(query.toLowerCase());
};

const extractMainCategories = (products) => {
  const set = new Set(["All Products"]);
  products.forEach(p => {
    if (p.category?.name) set.add(p.category.name);
  });
  return [...set];
};

const extractSubcategories = (products, mainCategory) => {
  const set = new Set(["All"]);
  if (mainCategory === "All Products") {
    products.forEach(p => {
      if (p.subCategory?.name) set.add(p.subCategory.name);
    });
  } else {
    products.forEach(p => {
      if (p.category?.name === mainCategory && p.subCategory?.name) {
        set.add(p.subCategory.name);
      }
    });
  }
  return [...set];
};

/* --------------------- Toast Notification --------------------- */
const ToastNotification = ({ message, type = "success", onClose }) => {
  if (!message) return null;
  const bg = type === "success" ? "bg-green-600" : "bg-red-600";

  return (
    <div className="fixed top-5 right-5 z-50 animate-fade-in-down">
      <div className={`${bg} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3`}>
        <span>{message}</span>
        <button onClick={onClose} className="text-white hover:text-gray-200 transition">
          ✖
        </button>
      </div>
    </div>
  );
};

/* --------------------- Product Card --------------------- */
const ProductCard = ({ product, addToCart, getQuantity, updateQuantity, navigate, onToggleWishlist, isLoggedIn }) => {
  const qty = getQuantity(product.id);
  const { finalPrice, original, discount } = getPriceData(product);
  const rating = product.rating || 4.3;
  
  const { toggleWishlist, isProductInWishlist } = useWishlist();
  const inWishlist = isProductInWishlist(product.id);

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    
    // ✅ LOGIN CHECK: Redirect if not logged in
    if (!isLoggedIn) {
      navigate("/login"); // Redirect to login page
      return;
    }
    // --- LOGIN CHECK END ---

    toggleWishlist(product);
    if (onToggleWishlist) {
      const message = inWishlist ? "💔 Removed from Wishlist" : "❤️ Added to Wishlist";
      onToggleWishlist(message);
    }
  };
  
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({ 
      id: product.id, 
      name: product.name,
      price: finalPrice,
      image: product.image,
      ...product, 
      quantity: 1 
    });
    
    if (onToggleWishlist) {
      onToggleWishlist("🛒 Added to Cart");
    }
  };

  return (
    <div
      key={product.id}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition border cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`, { state: { product } })}
    >
      {/* Image */}
      <div className="relative h-48">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full"
          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
        />
        
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-5 right-0 p-2 bg-white rounded-full shadow-md hover:scale-110 transition 
            ${inWishlist ? "text-red-700" : "text-red-400" }`}
           
        >
          <svg
            className="w-4 h-4"
            fill={inWishlist ? "#fdd8d8ff" : "none"}
            stroke="currentColor"
            viewBox="0 0 26 28"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 25s-9.5-5.6-12-12.3C-1.4 7.9 1.6 2.4 7 2.1c2.9-.1 5.1 1.8 6 3.4 1-1.6 3.1-3.5 6-3.4 5.4.3 8.4 5.8 6 10.6C22.5 19.4 13 25 13 25z"
            />
          </svg>
        </button>

        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium -mb-5 line-clamp-2 h-12">{product.name}</h3>

        {/* Rating and Price */}
        <div className="flex items-center mb-1">
          <span className="text-sm font-medium text-yellow-500 mr-1">
            {rating.toFixed(1)}
          </span>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8-2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-1">
          {original > finalPrice ? (
            <>
              <span className="text-red-600 font-semibold text-lg">₹ {finalPrice}</span>
              <span className="line-through text-gray-500">₹ {original}</span>
            </>
          ) : (
            <span className="text-gray-900 font-bold text-lg">₹ {finalPrice}</span>
          )}
        </div>

        {/* Add To Cart / View Cart Section */}
        {qty > 0 ? (
          <div className="space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/cart");
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              View Cart
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

/* --------------------- Main Component --------------------- */
const MAX_SLIDER = 100000;

const Printing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items = [], addToCart, updateQuantity } = useCart();

  const [products, setProducts] = useState([]);
  const [mainCategories, setMainCategories] = useState(["All Products"]);
  const [selectedMainCategory, setSelectedMainCategory] = useState("All Products");
  const [subCategories, setSubCategories] = useState(["All"]);
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // ✅ Get real login status from Wishlist Context
  const { isLoggedIn } = useWishlist();
  // ----------------------------------------------------------

  const searchQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  }, [location.search]);

  const getQuantity = (id) => {
    const item = items.find(i => i.id === id);
    return item ? item.quantity : 0;
  };

  /* --------------------- FETCH PRODUCTS --------------------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("productTag", "==", "Printing"));
        const snap = await getDocs(q);

        const list = snap.docs.map(doc => {
          const data = doc.data();
          const img = getMainImageUrl(data);
          const { finalPrice, original, discount, variant } = getPriceData(data);

          return {
            ...data,
            id: doc.id,
            image: img,
            price: finalPrice,
            originalPrice: original,
            discount,
            variant,
            rating: data.rating || 4.3,
          };
        });

        setProducts(list);
        const mainCats = extractMainCategories(list);
        setMainCategories(mainCats);

        const subs = extractSubcategories(list, "All Products");
        setSubCategories(subs);

        const maxPrice = Math.max(...list.map(p => p.price || 0), 1000);
        setPriceRange([0, Math.min(Math.ceil(maxPrice / 1000) * 1000, MAX_SLIDER)]);
      } catch (err) {
        console.error("Printing Store Fetch Error:", err);
        setToastMessage("Error loading products");
        setTimeout(() => setToastMessage(""), 3000);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const subs = extractSubcategories(products, selectedMainCategory);
    setSubCategories(subs);
    if (!searchQuery) {
      setSelectedSubCategory("All");
    }
  }, [selectedMainCategory, products, searchQuery]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  /* --------------------- FILTERING --------------------- */
  const filtered = useMemo(() => {
    const queryTerm = searchQuery.trim().toLowerCase();

    return products.filter(p => {
      const cat = p.category?.name || "";
      const sub = p.subCategory?.name || "";
      const price = p.price || 0;
      const priceMatch = price >= priceRange[0] && price <= priceRange[1];

      const searchMatch = !queryTerm || (
        keywordMatches(p.name, queryTerm) ||
        keywordMatches(p.description, queryTerm) ||
        (Array.isArray(p.searchKeywords) && p.searchKeywords.some(keyword => keywordMatches(keyword, queryTerm))) ||
        keywordMatches(p.category?.name, queryTerm) ||
        keywordMatches(p.subCategory?.name, queryTerm)
      );

      if (queryTerm) {
        return priceMatch && searchMatch;
      } else {
        const mainCategoryMatch =
          selectedMainCategory === "All Products" ||
          cat === selectedMainCategory;

        const subCategoryMatch =
          selectedSubCategory === "All" ||
          sub === selectedSubCategory;

        return priceMatch && mainCategoryMatch && subCategoryMatch;
      }
    });
  }, [products, selectedMainCategory, selectedSubCategory, priceRange, searchQuery]);

  const handlePriceChange = (index, value) => {
    const v = Number(value) || 0;
    const copy = [...priceRange];
    copy[index] = v;

    if (copy[0] > copy[1]) {
      if (index === 0) copy[1] = copy[0];
      else copy[0] = copy[1];
    }

    setPriceRange(copy);
  };

  const handleWishlistNotification = (message) => {
    setToastMessage(message);
  };

  /* --------------------- RENDER --------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastNotification 
        message={toastMessage} 
        onClose={() => setToastMessage("")} 
      />

      {/* Mobile Filter Button */}
      <div className="lg:hidden bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow hover:scale-110 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Category Navbar */}
      <div className="bg-white border-b shadow-sm hidden lg:block">
        <div className="max-w-7xl ml-5 px-4">
          <div className="flex overflow-x-auto py-3 space-x-6">
            {!searchQuery ? (
              mainCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedMainCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg transition ${
                    selectedMainCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))
            ) : (
              <h2 className="text-xl font-semibold py-2">
                Search Results for: <span className="text-blue-600">"{searchQuery}"</span>
              </h2>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl ml-5 px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters - Responsive */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white p-4 rounded-lg shadow-sm border lg:sticky lg:top-20 self-start`}>
            <h2 className="font-semibold mb-3">Filters</h2>

            {/* Subcategories */}
            <h3 className="text-sm font-medium mb-2">Subcategories</h3>
            <div className="space-y-2 mb-6">
              {subCategories.map((subCat) => (
                <label key={subCat} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="subcategory"
                    checked={selectedSubCategory === subCat}
                    onChange={() => setSelectedSubCategory(subCat)}
                    className="cursor-pointer"
                  />
                  <span className="text-sm">{subCat}</span>
                </label>
              ))}
            </div>

            <hr className="my-4" />

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-4">Price Range</h3>

              <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                <span>Min: ₹{priceRange[0].toLocaleString()}</span>
                <span>Max: ₹{priceRange[1].toLocaleString()}</span>
              </div>

              <div className="relative pt-1 mb-2">
                
                <input
                  type="range"
                  min="0"
                  max={MAX_SLIDER}
                  value={priceRange[0]}
                  onChange={(e) => handlePriceChange(0, e.target.value)}
                  className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none z-40 opacity-0"
                />
                
                <input
                  type="range"
                  min="0"
                  max={MAX_SLIDER}
                  value={priceRange[1]}
                  onChange={(e) => handlePriceChange(1, e.target.value)}
                  className="absolute w-full h-2 bg-transparent appearance-none pointer-events-auto z-50 custom-range-slider focus:outline-none"
                  style={{ WebkitAppearance: 'none' }}
                />
                
                <div className="h-2 bg-gray-300 rounded-full"></div> 
                
                <div
                   className="absolute h-2 bg-blue-600 rounded-full pointer-events-none top-1"
                  style={{
                    left: `${(priceRange[0] / MAX_SLIDER) * 100}%`,
                    width: `${((priceRange[1] - priceRange[0]) / MAX_SLIDER) * 100}%`
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>₹0</span>
                <span>₹{MAX_SLIDER.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Products Area */}
          <div className="flex-1">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold ">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : selectedMainCategory === "All Products"
                  ? "All Products"
                  : selectedMainCategory}
                {!searchQuery && selectedSubCategory !== "All" && ` - ${selectedSubCategory}`}
              </h2>
              <div className="text-sm text-gray-600 bg-gray-100 -mr-[210px] px-3 py-1 rounded-full">
                {filtered.length} products
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-10 text-gray-500">
                Loading products…
              </div>
            )}

            {/* No Products */}
            {!loading && filtered.length === 0 && (
              <div className="bg-white border rounded-lg shadow-sm text-center py-10 text-gray-500">
                {searchQuery
                  ? `No products found matching "${searchQuery}"`
                  : "No products found"}
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters.</p>
              </div>
            )}

            {/* Products Grid - Responsive */}
            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    addToCart={addToCart}
                    updateQuantity={updateQuantity}
                    getQuantity={getQuantity}
                    navigate={navigate}
                    onToggleWishlist={handleWishlistNotification}
                    isLoggedIn={isLoggedIn} // ✅ Passing the real login status
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Printing;