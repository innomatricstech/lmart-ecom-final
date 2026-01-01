import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useCart } from "../context/CartContext";


// ⭐ Star Rating Component
const StarRating = ({
  rating = 0,
  size = "w-4 h-4",
  color = "text-yellow-500",
  showText = false,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {Array(5)
        .fill(0)
        .map((_, i) => {
          const starValue = i + 1;

          return (
            <div key={i} className="relative">
              {/* Gray background star */}
              <svg
                className={`${size} text-gray-300`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>

              {/* Colored star overlay */}
              {(starValue <= fullStars ||
                (starValue === fullStars + 1 && hasHalfStar)) && (
                <svg
                  className={`${size} ${color} absolute inset-0`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
          );
        })}

      {showText && (
        <span className="ml-2 text-sm font-semibold text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// ⭐ Review Modal Component
const WriteReviewModal = ({
  onClose,
  onSubmit,
  productName,
  currentUser,
  productId,
  navigate,
}) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!rating) newErrors.rating = "Please select a rating";
    if (!title.trim()) newErrors.title = "Review title is required";
    if (!content.trim()) newErrors.content = "Review content is required";
    if (content.trim().length < 10)
      newErrors.content = "Review must be at least 10 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onSubmit({ rating, title, content });
      if (ok) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      setErrors({ submit: "Failed to submit review. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Clear the state to prevent reopening on refresh
    if (window.history.state?.state?.showReviewModal) {
      navigate(`/product/${productId}`, { replace: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-xl">Write a Review – {productName}</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        {/* User Info Display - Guest or User */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Reviewing as:</span>
            {currentUser
              ? currentUser.displayName || currentUser.name || "User"
              : "Guest User"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {currentUser
              ? `User ID: ${currentUser.uid || currentUser.id}`
              : "You're reviewing as a guest"}
          </p>
        </div>

        <form onSubmit={submitReview}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating *
            </label>
            <div className="flex justify-center space-x-1">
              {Array(5)
                .fill(0)
                .map((_, i) => {
                  const starValue = i + 1;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-10 h-10 cursor-pointer transition-transform hover:scale-110 ${
                          starValue <= (hoverRating || rating)
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  );
                })}
            </div>
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Title *
              </label>
              <input
                className={`border ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } p-3 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                placeholder="What's most important to know?"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Review *
              </label>
              <textarea
                className={`border ${
                  errors.content ? "border-red-500" : "border-gray-300"
                } p-3 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                rows={4}
                placeholder="Share your experience with this product..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors((prev) => ({ ...prev, content: "" }));
                }}
                maxLength={1000}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-lg text-white font-semibold mt-6 transition-all ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            }`}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ⭐ FETCH AVG RATING & REVIEW COUNT FROM REVIEWS COLLECTION
const fetchReviewStats = async (productId) => {
  const q = query(
    collection(db, "reviews"),
    where("productId", "==", productId)
  );

  const snap = await getDocs(q);

  let total = 0;
  let count = 0;

  snap.forEach((doc) => {
    const data = doc.data();
    if (typeof data.rating === "number") {
      total += data.rating;
      count++;
    }
  });

  return {
    rating: count > 0 ? Number((total / count).toFixed(1)) : 0,
    reviewCount: count,
  };
};

// ⭐ PRICE HELPER (DO NOT CHANGE ANY OTHER LOGIC)
const getVariantPrice = (product) => {
  if (!Array.isArray(product?.variants)) {
    return {
      finalPrice: product.price || 0,
      originalPrice: 0,
    };
  }

  const variant =
    product.variants.find((v) => v.offerPrice || v.price) ||
    product.variants[0];

  if (!variant) {
    return { finalPrice: 0, originalPrice: 0 };
  }

  const price = Number(variant.price || 0);
  const offer = Number(variant.offerPrice || 0);

  if (offer > 0 && offer < price) {
    return {
      finalPrice: offer,
      originalPrice: price,
    };
  }

  return {
    finalPrice: price,
    originalPrice: 0,
  };
};

// 🛒 FIXED Related Products Component
const RelatedProducts = ({
  categoryId,
  currentProductId,
  source,
  storeLabel,
}) => {
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!categoryId || !source) return;

      setLoading(true);
      try {
        // 🔄 Identify collection
        let collectionName = "products";
        if (source === "local-market") collectionName = "localmarket";
        if (source === "printing") collectionName = "printing";

        const productsRef = collection(db, collectionName);
        const querySnapshot = await getDocs(productsRef);

        const products = [];

        // ✅ ONLY THIS LOOP — NO forEach
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();

          const productCategory =
            typeof data.category === "object"
              ? data.category.id
              : data.category;
          const categoryToCompare =
            typeof categoryId === "object" ? categoryId.id : categoryId;

          if (
            productCategory === categoryToCompare &&
            docSnap.id !== currentProductId
          ) {
            // ⭐ FETCH REVIEWS
            const reviewStats = await fetchReviewStats(docSnap.id);

            const { finalPrice, originalPrice } = getVariantPrice(data);

            products.push({
              id: docSnap.id,
              ...data,
              image: data.imageUrls?.[0]?.url || "",
              price: finalPrice, // ✅ UI already uses product.price
              originalPrice: originalPrice,
              name: data.name,
              rating: reviewStats.rating,
              reviewCount: reviewStats.reviewCount,
            });
          }
        }

        // 🔥 Randomize & limit
        const selectedProducts = products
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);

        setRelatedProducts(selectedProducts);
      } catch (error) {
        console.error("Error fetching related products:", error);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, currentProductId, source]);

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Related Products from
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-300"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                <div className="h-6 bg-gray-300 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🔄 Don't show anything if no related products
  if (relatedProducts.length === 0) {
    console.log("No related products found");
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
        <button
          onClick={() => {
            let storePath = "";
            switch (source) {
              case "local-market":
                storePath = "/local-market";
                break;
              case "printing":
                storePath = "/printing";
                break;
              default:
                storePath = "/e-market";
                break;
            }

            navigate(storePath);

            // 🔝 NAVIGATION KAPRAM SCROLL TOP
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }, 0);
          }}
          className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-2 hover:underline transition-colors"
        >
          View All
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[299px] mt-2">
        {relatedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-200 hover:border-purple-300"
            onClick={() =>
              navigate(`/product/${product.id}`, {
                state: {
                  product,
                  source: product.productTag || source,
                },
              })
            }
          >
            {/* PRODUCT IMAGE */}
            <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden ">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/300x200?text=Product";
                  }}
                />
              ) : (
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            {/* PRODUCT INFO */}
            <div className="p-3">
              <h3 className="font-medium text-xs sm:text-base leading-tight line-clamp-2">
                {product.name}
              </h3>

              {/* RATING */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm font-medium text-yellow-600">
                  {(product.rating ?? 0).toFixed(1)}
                </span>

                <StarRating
                  rating={product.rating ?? 0}
                  size="w-3 h-3"
                  color="text-yellow-500"
                />

                <span className="text-xs text-gray-500">
                  ({product.reviewCount ?? 0})
                </span>
              </div>

              {/* PRICE */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-base font-bold text-gray-900">
                  ₹
                  {product.price?.toLocaleString() ||
                    product.offerPrice?.toLocaleString() ||
                    "0"}
                </span>

                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
              </div>

              {/* STOCK / VIEW */}
              <div className="mt-1">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    <svg
                      className="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex w-full items-center justify-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition">
                    View
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to check if URL is a video
const isVideoUrl = (url) => {
  if (!url) return false;

  // Check by file extension
  const videoExtensions = [
    ".mp4",
    ".webm",
    ".ogg",
    ".mov",
    ".avi",
    ".wmv",
    ".flv",
    ".mkv",
  ];
  const urlLower = url.toLowerCase();

  // Check if URL contains video patterns
  return (
    videoExtensions.some((ext) => urlLower.includes(ext)) ||
    urlLower.includes("video") ||
    (urlLower.includes("firebasestorage") &&
      (urlLower.includes(".mp4") ||
        urlLower.includes(".webm") ||
        urlLower.includes(".ogg")))
  );
};

// ⭐ Main Product Detail Component
const ProductDetail = ({ product: propProduct }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const storage = getStorage();
  const { addToCart } = useCart();

  const productState = useMemo(() => location.state?.product, [location.state]);

  const [product, setProduct] = useState(propProduct || null);
  const [loading, setLoading] = useState(!propProduct);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [currentImg, setCurrentImg] = useState("");
  const [currentIsVideo, setCurrentIsVideo] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [variant, setVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [stats, setStats] = useState({
    avg: 0,
    total: 0,
    dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [colorImageMap, setColorImageMap] = useState({});
  const [showAllReviews, setShowAllReviews] = useState(false);

  // FIXED: Get store info from location state or prop
  const productTag = location.state?.source || product?.productTag || null;
  const source = location.state?.source || "e-market";

  // 🔙 BACK BUTTON HANDLER - FIXED according to image
  const handleBack = () => {
    let path = "/e-market"; // default

    if (productTag === "local-market") path = "/local-market";
    if (productTag === "printing") path = "/printing";
    if (productTag === "e-market") path = "/e-market";

    navigate(path);

    // 🔝 scroll to top
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  // Default to e-market
  const { storePath, storeLabel } = useMemo(() => {
    if (source === "local-market") {
      return { storePath: "/local-market", storeLabel: "Local Market" };
    }
    if (source === "printing") {
      return { storePath: "/printing", storeLabel: "Printing" };
    }
    if (source === "e-market") {
      return { storePath: "/e-market", storeLabel: "E-store" };
    }
    // Default fallback
    return { storePath: "/e-market", storeLabel: "E-store" };
  }, [source]);

  // 🔝 AUTO SCROLL TO TOP
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId]);

  // 🔄 GET CURRENT LOGGED IN USER
  useEffect(() => {
    const getUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userDataStr = localStorage.getItem("userData");
        const userStr = localStorage.getItem("user");

        if (token) {
          let userData = null;

          // Try to parse user data from localStorage
          if (userDataStr) {
            try {
              userData = JSON.parse(userDataStr);
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }

          // If no userData, try the 'user' key
          if (!userData && userStr) {
            try {
              userData = JSON.parse(userStr);
            } catch (e) {
              console.error("Error parsing user:", e);
            }
          }

          if (userData) {
            setCurrentUser({
              uid: userData.uid || token,
              id: userData.uid || token,
              ...userData,
              displayName:
                userData.displayName ||
                userData.name ||
                userData.email?.split("@")[0] ||
                "User",
              email: userData.email || "",
              photoURL: userData.photoURL || "",
            });
          } else {
            // Try to fetch from Firestore using token as userId
            try {
              const userRef = doc(db, "users", token);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();
                setCurrentUser({
                  uid: token,
                  id: token,
                  ...userData,
                  displayName: userData.displayName || userData.name || "User",
                  email: userData.email || "",
                  photoURL: userData.photoURL || "",
                });
              } else {
                setCurrentUser(null);
              }
            } catch (error) {
              console.log("❌ Error fetching from Firestore:", error);
              setCurrentUser(null);
            }
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("❌ Error getting user data:", error);
        setCurrentUser(null);
      }
    };

    getUserData();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (
        e.key === "token" ||
        e.key === "userData" ||
        e.key === "user" ||
        e.key === "isLoggedIn"
      ) {
        getUserData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Poll for changes
    const storagePollInterval = setInterval(() => {
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      if ((token && !currentUser) || (!token && currentUser)) {
        getUserData();
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(storagePollInterval);
    };
  }, []);

  // ⭐ Auto-open review modal after login redirect
  useEffect(() => {
    const { state } = location;

    // Check if we're returning from login with review redirect
    if (state?.showReviewModal && currentUser) {
      setTimeout(() => {
        setShowReviewModal(true);
      }, 300);

      // Clear the state after opening modal
      setTimeout(() => {
        if (location.state?.showReviewModal) {
          navigate(`/product/${productId}`, { replace: true });
        }
      }, 500);
    }
  }, [location.state, currentUser, navigate, productId]);

  // ✨ Toast notification system
  const addToast = useCallback(
    (product, variant, quantity) => {
      const toastId = Date.now();
      const variantType = Math.floor(Math.random() * 3);

      const newToast = {
        id: toastId,
        productName: product.name,
        productImage: currentImg || product.imageUrls?.[0]?.url || "",
        price: variant?.offerPrice ?? variant?.price ?? product.price ?? 0,
        quantity: quantity,
        variant: `${selectedColor}${selectedSize ? ` - ${selectedSize}` : ""}`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        variantType,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

      // Play success sound (optional)
      if (typeof window !== "undefined") {
        const audio = new Audio(
          "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3"
        );
        audio.volume = 0.2;
        audio.play().catch((e) => console.log("Audio play failed:", e));
      }

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
      }, 4000);
    },
    [currentImg, selectedColor, selectedSize]
  );

  // 📝 FETCH REVIEWS FROM FIRESTORE
  const fetchReviews = useCallback(async () => {
    try {
      if (!productId) return;

      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId)
      );

      const querySnapshot = await getDocs(q);

      const reviewsData = [];
      const authenticatedUserIds = new Set();

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        reviewsData.push({
          id: doc.id,
          rating: data.rating || 0,
          title: data.title || "",
          content: data.content || "",
          userName: data.userName || "Anonymous",
          userId: data.userId || "guest",
          userType: data.userType || "guest",
          productId: data.productId || "",
          productName: data.productName || "",
          verifiedPurchase: data.verifiedPurchase || false,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        });

        if (
          data.userId &&
          !data.userId.startsWith("guest_") &&
          data.userType === "authenticated"
        ) {
          authenticatedUserIds.add(data.userId);
        }
      });

      const usersData = {};

      if (authenticatedUserIds.size > 0) {
        const userPromises = Array.from(authenticatedUserIds).map(
          async (userId) => {
            try {
              const userRef = doc(db, "users", userId);
              const userSnap = await getDoc(userRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();
                usersData[userId] = {
                  uid: userId,
                  id: userId,
                  ...userData,
                  displayName:
                    userData.displayName ||
                    userData.name ||
                    userData.email?.split("@")[0] ||
                    "User",
                  photoURL: userData.photoURL || "",
                };
              } else {
                usersData[userId] = {
                  uid: userId,
                  id: userId,
                  displayName: "User",
                  photoURL: "",
                };
              }
            } catch (error) {
              console.error(`Error fetching user ${userId}:`, error);
              usersData[userId] = {
                uid: userId,
                id: userId,
                displayName: "User",
                photoURL: "",
              };
            }
          }
        );

        await Promise.all(userPromises);
      }

      setUsersMap(usersData);

      reviewsData.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewsData);

      const total = reviewsData.length;
      let sum = 0;
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      reviewsData.forEach((review) => {
        const rating = Math.max(
          1,
          Math.min(5, Math.floor(Number(review.rating) || 0))
        );
        dist[rating] = (dist[rating] || 0) + 1;
        sum += rating;
      });

      const avg =
        total === 0 ? product?.rating || 4.3 : +(sum / total).toFixed(1);
      setStats({ avg, total, dist });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setStats({
        avg: product?.rating || 4.3,
        total: 0,
        dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }
  }, [productId, product?.rating]);

  // 🔄 LOAD PRODUCT DATA
  useEffect(() => {
    const loadProduct = async () => {
      // If product is passed as prop, use it
      if (propProduct) {
        setProduct(propProduct);
        processProductData(propProduct);
        await fetchReviews();
        setLoading(false);
        return;
      }

      // Otherwise fetch from Firestore
      setLoading(true);
      setImageLoading(true);

      try {
        let productData = null;

        // Check if product data is passed via state
        if (productState && productState.id === productId) {
          productData = productState;
        } else {
          // Fetch from Firestore
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            productData = {
              id: productSnap.id,
              ...productSnap.data(),
            };
          }
        }

        if (productData) {
          setProduct(productData);
          processProductData(productData);
          await fetchReviews();
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    const processProductData = (productData) => {
      // Process images
      const imageUrls = productData.imageUrls || [];
      const urls = imageUrls
        .filter((img) => {
          if (typeof img === "string") return true;
          if (img?.isMain === true) return false;
          return true;
        })
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean);

      setImages(urls);

      // Fetch video URLs
      let videoUrls = [];

      // Check if product has video URLs stored in Firestore
      if (productData.videoUrls && Array.isArray(productData.videoUrls)) {
        videoUrls = productData.videoUrls
          .map((video) => {
            if (typeof video === "string") return video;
            if (video?.url) return video.url;
            return null;
          })
          .filter(Boolean);
      }

      // If video URLs are stored as storage paths, fetch them from Firebase Storage
      if (
        productData.videoStoragePaths &&
        Array.isArray(productData.videoStoragePaths)
      ) {
        const videoPromises = productData.videoStoragePaths.map(
          async (storagePath) => {
            try {
              if (!storagePath) return null;
              const videoRef = ref(storage, storagePath);
              const downloadURL = await getDownloadURL(videoRef);
              return downloadURL;
            } catch (error) {
              console.error(
                `Error fetching video from path ${storagePath}:`,
                error
              );
              return null;
            }
          }
        );

        Promise.all(videoPromises).then((fetchedVideoUrls) => {
          const allVideoUrls = [
            ...videoUrls,
            ...fetchedVideoUrls.filter(Boolean),
          ];
          setVideos(allVideoUrls);
        });
      } else {
        setVideos(videoUrls);
      }

      // Check for single videoUrl field
      if (productData.videoUrl && !videoUrls.includes(productData.videoUrl)) {
        setVideos((prev) => [...prev, productData.videoUrl]);
      }

      const variants = productData.variants || [];

      // Get unique colors from variants that have stock > 0
      const colors = [
        ...new Set(
          variants
            .filter((v) => v.color && (v.stock === undefined || v.stock > 0))
            .map((v) => v.color)
            .filter(Boolean)
        ),
      ];

      // Get unique sizes from variants that have stock > 0
      const sizes = [
        ...new Set(
          variants
            .filter((v) => v.size && (v.stock === undefined || v.stock > 0))
            .map((v) => v.size)
            .filter(Boolean)
        ),
      ];

      setAvailableColors(colors);
      setAvailableSizes(sizes);

      // Create color-image mapping
      if (productData.colorImageMap) {
        setColorImageMap(productData.colorImageMap);
      } else {
        // Create default mapping
        const defaultMap = {};
        colors.forEach((color, index) => {
          if (urls[index]) {
            defaultMap[color] = index;
          } else if (urls.length > 0) {
            defaultMap[color] = index % urls.length;
          }
        });
        setColorImageMap(defaultMap);
      }

      // Combine images and videos for display
      const allMedia = [...urls, ...videoUrls];

      // Set current image
      if (allMedia.length > 0) {
        let nextImg = null;

        // First load
        if (!currentImg) {
          if (
            colors.length > 0 &&
            colorImageMap[colors[0]] !== undefined &&
            urls[colorImageMap[colors[0]]]
          ) {
            nextImg = urls[colorImageMap[colors[0]]];
          } else {
            nextImg = allMedia[0];
          }
        }
        // Preserve existing image
        else if (allMedia.includes(currentImg)) {
          nextImg = currentImg;
        }
        // If current image deleted
        else {
          nextImg = allMedia[0];
        }

        setCurrentImg(nextImg);
        setCurrentIsVideo(isVideoUrl(nextImg));
        setImageLoading(true);
      } else {
        setCurrentImg("https://placehold.co/600x400?text=No+Image");
        setCurrentIsVideo(false);
        setImageLoading(false);
      }

      // Set default selections
      if (colors.length > 0) {
        setSelectedColor(colors[0]);
      }
      if (sizes.length > 0) {
        setSelectedSize(sizes[0]);
      }

      // Find initial variant
      let initialVariant = null;

      // First try to find variant with both color and size
      if (colors.length > 0 && sizes.length > 0) {
        initialVariant = variants.find(
          (v) =>
            v.color === colors[0] &&
            v.size === sizes[0] &&
            (v.stock === undefined || v.stock > 0)
        );
      }

      // If not found, try to find variant with just color
      if (!initialVariant && colors.length > 0) {
        initialVariant = variants.find(
          (v) => v.color === colors[0] && (v.stock === undefined || v.stock > 0)
        );
      }

      // If still not found, take the first variant with stock
      if (!initialVariant) {
        initialVariant =
          variants.find((v) => v.stock === undefined || v.stock > 0) ||
          variants[0] ||
          null;
      }

      setVariant(initialVariant);
    };

    loadProduct();
  }, [productId, productState, fetchReviews, propProduct]);

  // 🔄 Update variant when color/size changes
  useEffect(() => {
    if (!product || !product.variants) return;

    const variants = product.variants || [];
    let selectedVariant = null;

    // If both color and size are selected, try to find exact match
    if (selectedColor && selectedSize) {
      selectedVariant = variants.find(
        (v) =>
          v.color === selectedColor &&
          v.size === selectedSize &&
          (v.stock === undefined || v.stock > 0)
      );
    }

    // If not found or only color is selected, try to find by color
    if (!selectedVariant && selectedColor) {
      selectedVariant = variants.find(
        (v) =>
          v.color === selectedColor && (v.stock === undefined || v.stock > 0)
      );
    }

    // If still not found, take the first available variant
    if (!selectedVariant) {
      selectedVariant =
        variants.find((v) => v.stock === undefined || v.stock > 0) || null;
    }

    setVariant(selectedVariant);
  }, [selectedColor, selectedSize, product]);

  // ⭐ FIXED: Get available sizes for selected color
  const getAvailableSizesForColor = useMemo(() => {
    if (!product || !product.variants || !selectedColor) return [];

    return [
      ...new Set(
        product.variants
          .filter(
            (v) =>
              v.color === selectedColor &&
              v.size &&
              (v.stock === undefined || v.stock > 0)
          )
          .map((v) => v.size)
          .filter(Boolean)
      ),
    ];
  }, [product, selectedColor]);

  // 🎨 Handle color selection - updates image based on color
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // Reset size when color changes
    setSelectedSize("");

    // Update image based on selected color
    if (colorImageMap[color] !== undefined && images[colorImageMap[color]]) {
      setCurrentImg(images[colorImageMap[color]]);
      setCurrentIsVideo(false);
      setImageLoading(true);
    } else {
      // Fallback to first image if no mapping found
      if (images.length > 0) {
        setCurrentImg(images[0]);
        setCurrentIsVideo(false);
        setImageLoading(true);
      }
    }
  };

  // 📱 Responsive image gallery handler
  const onThumbnailClick = (media, index) => {
    setCurrentImg(media);
    setImageLoading(true);

    // Check if it's a video
    const isVideo = isVideoUrl(media);
    setCurrentIsVideo(isVideo);

    // Update color selection if image is associated with a color
    if (!isVideo && colorImageMap) {
      for (const [color, imgIndex] of Object.entries(colorImageMap)) {
        if (imgIndex === index) {
          setSelectedColor(color);
          break;
        }
      }
    }
  };

  // ➕➖ Quantity handlers
  const increment = () => {
    const max = variant?.stock ?? 99;
    setQuantity((prev) => Math.min(prev + 1, max));
  };

  const decrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    const max = variant?.stock ?? 99;
    setQuantity(Math.max(1, Math.min(value, max)));
  };

  // ⭐ Handle review button click - check login status
  const handleReviewButtonClick = () => {
    // Check localStorage directly for immediate login status
    const token = localStorage.getItem("token");
    const isLoggedIn = token && localStorage.getItem("isLoggedIn") === "true";

    if (isLoggedIn) {
      // User is logged in, show review modal directly
      if (!currentUser) {
        // Make sure currentUser state is up to date
        const userDataStr = localStorage.getItem("userData");
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            setCurrentUser({
              uid: userData.uid || token,
              id: userData.uid || token,
              ...userData,
              displayName: userData.displayName || userData.name || "User",
            });
          } catch (e) {
            console.error("Error parsing userData:", e);
          }
        }
      }

      setShowReviewModal(true);
    } else {
      // User is not logged in, redirect to login page
      navigate("/login", {
        state: {
          reviewRedirect: true,
          productId: productId,
          productName: product?.name || "Product",
          from: `/product/${productId}`,
        },
      });
    }
  };

  // 🛒 Add to cart
  const onAddToCart = async (e) => {
    e.preventDefault();

    if (!product || !variant) {
      alert("Please select a variant");
      return;
    }

    if (variant.stock !== undefined && variant.stock < quantity) {
      alert(`Only ${variant.stock} units available`);
      return;
    }

    setAddingToCart(true);

    const price = variant.offerPrice ?? variant.price ?? product.price ?? 0;
    const item = {
      id: product.id,
      name: product.name,
      price,
      originalPrice: variant.price ?? product.price ?? 0,
      quantity,
      variantId: variant.variantId ?? variant.variant_id ?? variant.id,
      selectedColor,
      selectedSize,
      image: !currentIsVideo
        ? currentImg
        : images[0] || product.imageUrls?.[0]?.url || "",
      stock: variant.stock ?? 0,
      colors: availableColors || [],
      sizes: availableSizes || [],
      brand: product.brand || "",
    };

    addToCart(item);

    // Button click animation
    const button = e.currentTarget;
    button.classList.add("clicked");
    setTimeout(() => {
      button.classList.remove("clicked");
    }, 300);

    setTimeout(() => {
      setAddingToCart(false);
    }, 300);
  };

  // 🔄 Stock update function for Buy Now
  const updateStockInFirestore = async (
    productId,
    variantId,
    quantityToDeduct
  ) => {
    if (!variantId || !productId) {
      console.error("Missing productId or variantId for stock update.");
      return false;
    }

    const productRef = doc(db, "products", productId);

    try {
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error("Product does not exist!");
        }

        const productData = productDoc.data();
        const variants = productData.variants || [];
        let variantIndex = -1;

        // Find the index of the specific variant
        variantIndex = variants.findIndex(
          (v) => (v.variantId ?? v.variant_id) === variantId
        );

        if (variantIndex === -1) {
          // Fallback for older data without variantId, matching by color/size
          variantIndex = variants.findIndex(
            (v) => v.color === selectedColor && v.size === selectedSize
          );
        }

        if (variantIndex === -1) {
          throw new Error("Variant not found in product data!");
        }

        const currentStock = variants[variantIndex].stock || 0;
        const newStock = currentStock - quantityToDeduct;

        if (newStock < 0) {
          throw new Error(
            `Insufficient stock: Only ${currentStock} units available.`
          );
        }

        // Update the stock field
        variants[variantIndex].stock = newStock;

        // Update the document in the transaction
        transaction.update(productRef, { variants: variants });
      });

      console.log(
        `Stock successfully reduced by ${quantityToDeduct} for variant: ${variantId}`
      );
      return true;
    } catch (e) {
      console.error("Stock update transaction failed: ", e);
      alert(`Failed to confirm purchase. ${e.message}`);
      return false;
    }
  };

  // 💳 Buy Now handler
  const onBuyNow = async (e) => {
    e.preventDefault();

    if (!product || !variant) {
      alert("Please select a variant");
      return;
    }

    if (variant.stock !== undefined && variant.stock < quantity) {
      alert(`Only ${variant.stock} units available`);
      return;
    }

    const price = variant.offerPrice ?? variant.price ?? product.price ?? 0;
    const item = {
      id: product.id,
      name: product.name,
      price,
      originalPrice: variant.price ?? product.price ?? 0,
      quantity,
      variantId: variant.variantId ?? variant.variant_id ?? variant.id,
      selectedColor,
      selectedSize,
      image: !currentIsVideo
        ? currentImg
        : images[0] || product.imageUrls?.[0]?.url || "",
      stock: variant.stock ?? 0,
      brand: product.brand || "",
    };

    // Update stock in Firestore
    const stockUpdateSuccess = await updateStockInFirestore(
      product.id,
      item.variantId,
      item.quantity
    );

    if (!stockUpdateSuccess) {
      return;
    }

    // Prepare for checkout
    sessionStorage.removeItem("selectedCartItems");
    sessionStorage.setItem("buyNowItem", JSON.stringify(item));
    sessionStorage.setItem("buyNowFlag", "true");

    // Navigate to checkout
    navigate("/checkout", {
      state: {
        item: item,
        buyNow: true,
        skipToPayment: true,
      },
    });

    // Button click animation
    const button = e.currentTarget;
    button.classList.add("clicked");
    setTimeout(() => {
      button.classList.remove("clicked");
    }, 300);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ⭐ Submit review to Firestore - Guest or User
  const submitReview = async ({ rating, title, content }) => {
    try {
      const isGuest = !currentUser;

      if (isGuest) {
        const guestId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        const guestName = "Guest User";

        const payload = {
          productId,
          productName: product?.name || "",
          rating: Number(rating),
          title,
          content,
          userId: guestId,
          userName: guestName,
          userEmail: "",
          userType: "guest",
          verifiedPurchase: false,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "reviews"), payload);
      } else {
        const payload = {
          productId,
          productName: product?.name || "",
          rating: Number(rating),
          title,
          content,
          userId: currentUser.uid || currentUser.id,
          userName: currentUser.displayName || currentUser.name || "User",
          userEmail: currentUser.email || "",
          userType: "authenticated",
          verifiedPurchase: false,
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "reviews"), payload);
      }

      await fetchReviews();

      // ✅ Removed the toast notification for review submission
      return true;
    } catch (error) {
      console.error("Error submitting review:", error);
      return false;
    }
  };

  // 📦 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 rounded-full border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // ❌ Product not found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center p-8 rounded-2xl bg-white shadow-lg max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/e-market")}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  // 📊 Product data calculations
  const isInStock = variant?.stock === undefined ? true : variant.stock > 0;
  const displayPrice =
    variant?.offerPrice ?? variant?.price ?? product.price ?? 0;
  const originalPrice = variant?.price ?? product.price ?? 0;
  const discount =
    originalPrice > displayPrice
      ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
      : 0;

  // Combine images and videos for thumbnail display
  const allMedia = [...images, ...videos];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 relative">
      {/* Toast Notifications Container */}
      <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm toast-container">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`relative overflow-hidden rounded-2xl shadow-2xl border-l-4 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl ${
              toast.type === "error"
                ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-500"
                : toast.variantType === 0
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-500"
                : toast.variantType === 1
                ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500"
                : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-500"
            }`}
            style={{
              animation: `toastSlideIn 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) ${
                index * 0.1
              }s both, toastFloat 3s ease-in-out ${
                index * 0.1
              }s infinite alternate`,
            }}
          >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative p-4">
              <div className="flex items-start space-x-4">
                {/* Icon/Image */}
                {toast.type === "error" ? (
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                ) : toast.productImage ? (
                  <div className="relative flex-shrink-0">
                    <div
                      className={`absolute inset-0 rounded-xl blur-md ${
                        toast.variantType === 0
                          ? "bg-emerald-200"
                          : toast.variantType === 1
                          ? "bg-blue-200"
                          : "bg-purple-200"
                      }`}
                    ></div>
                    <img
                      src={toast.productImage}
                      alt={toast.productName}
                      className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-lg relative"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/64x64?text=🎁";
                      }}
                    />
                    {toast.type !== "error" && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {toast.message || "Added to Cart!"}
                    </h4>
                    <span className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-full">
                      {toast.time}
                    </span>
                  </div>

                  {!toast.message && (
                    <>
                      <p className="font-semibold text-gray-800 text-sm truncate mb-1">
                        {toast.productName}
                      </p>
                      {toast.variant && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {toast.variant}
                          </span>
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                            Qty: {toast.quantity}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-lg font-bold ${
                            toast.variantType === 0
                              ? "text-emerald-600"
                              : toast.variantType === 1
                              ? "text-blue-600"
                              : "text-purple-600"
                          }`}
                        >
                          ₹{toast.price}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full animate-progress-bar ${
                    toast.type === "error"
                      ? "bg-gradient-to-r from-red-400 to-orange-500"
                      : toast.variantType === 0
                      ? "bg-gradient-to-r from-emerald-400 to-green-500"
                      : toast.variantType === 1
                      ? "bg-gradient-to-r from-blue-400 to-cyan-500"
                      : "bg-gradient-to-r from-purple-400 to-pink-500"
                  }`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <WriteReviewModal
          onClose={() => setShowReviewModal(false)}
          onSubmit={submitReview}
          productName={product.name}
          currentUser={currentUser}
          productId={productId}
          navigate={navigate}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🔙 FIXED: Back Button and Breadcrumb Layout - Matching Image */}
        <div className="flex justify-between items-center mb-6">
          {/* Breadcrumb Navigation - Right side like in image */}
          <nav className="text-sm text-gray-600 flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            {/* Home */}
            <button
              onClick={() => navigate("/")}
              className="hover:text-gray-800 hover:underline transition-colors"
            >
              Home
            </button>

            {/* Store/ProductTag */}
            {productTag && (
              <>
                <svg
                  className="w-3 h-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>

                <button
                  onClick={() => {
                    let path = "/e-market";

                    if (productTag === "local-market") path = "/local-market";
                    if (productTag === "printing") path = "/printing";
                    if (productTag === "e-market") path = "/e-market";

                    navigate(path);

                    // 🔝 navigation apram scroll top
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 0);
                  }}
                  className="capitalize text-purple-600 hover:text-purple-800 hover:underline transition-colors"
                >
                  {productTag.replace("-", " ")}
                </button>
              </>
            )}

            {/* Product name */}
            <svg
              className="w-3 h-3 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>

            <span className="text-gray-800 font-medium truncate max-w-xs">
              {product.name}
            </span>
          </nav>
          {/* Back Button - Left side like in image */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden ">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 p-3 md:p-4">
            {/* LEFT SIDE — MEDIA */}
           <div className="space-y-3">
  {/* MAIN IMAGE / VIDEO */}
  <div
    className="
      relative
      w-full
      max-w-[450px]
      h-[280px]
      sm:h-[360px]
      md:h-[420px]
      lg:h-[500px]
      mx-auto
      lg:ml-12
      rounded-lg
      overflow-hidden
      flex
      items-center
      justify-center
    "
  >
    {currentImg ? (
      <>
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-14 w-14 rounded-full border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* VIDEO */}
        {currentIsVideo || isVideoUrl(currentImg) ? (
          <div className="w-full h-full flex items-center justify-center">
            <video
              src={currentImg}
              controls
              controlsList="nodownload"
              className="w-full h-full object-contain transition-opacity duration-300 rounded-xl"
              onLoadedData={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                if (images.length > 0) {
                  setCurrentImg(images[0]);
                  setCurrentIsVideo(false);
                }
              }}
              poster={
                images[0] ||
                "https://placehold.co/600x400?text=Video+Loading"
              }
              playsInline
            />

            {/* Video Badge */}
            <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              VIDEO
            </div>
          </div>
        ) : (
          <img
            src={currentImg}
            alt={product.name}
            className={`
              w-full
              h-full
              object-contain
              transition-opacity
              duration-300
              ${imageLoading ? "opacity-0" : "opacity-100"}
            `}
            onLoad={() => setImageLoading(false)}
            loading="lazy"
          />
        )}
      </>
    ) : images.length > 0 ? (
      <>
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-purple-600"></div>
          </div>
        )}

        <img
          src={images[0]}
          alt={product.name}
          className="
            w-full
            h-full
            object-contain
            transition-opacity
            duration-300
          "
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            e.target.src = "https://placehold.co/500x300?text=No+Image";
            setImageLoading(false);
          }}
          loading="lazy"
        />
      </>
    ) : (
      <div className="text-center p-8">
        <p className="text-gray-500">No image available</p>
      </div>
    )}
  </div>

  {/* THUMBNAILS */}
  {allMedia.length > 1 && (
    <div
      className="
        grid
        grid-cols-4
        gap-3
        w-full
        max-w-[360px]
        mx-auto
        lg:ml-[62px]
      "
    >
      {allMedia.map((media, i) => {
        const isVideo = isVideoUrl(media);

        return (
          <button
            key={i}
            onClick={() => onThumbnailClick(media, i)}
            className={`rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              currentImg === media
                ? "border-purple-500 ring-2 ring-purple-200"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {isVideo ? (
              <div className="relative h-20 sm:h-24 w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">VIDEO</span>
              </div>
            ) : (
              <img
                src={media}
                alt={`Thumbnail ${i + 1}`}
                className="
                  h-20
                  sm:h-24
                  w-full
                  object-contain
                  bg-white
                  transition-opacity
                "
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/150x100?text=Image";
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  )}
</div>


            {/* RIGHT SIDE — DETAILS */}
            <div className="-ml-20">
              <div>
                {product.brand && (
                  <p className="text-purple-600 font-semibold uppercase tracking-wider text-sm mb-2">
                    {product.brand}
                  </p>
                )}
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* ⭐ Rating */}
              <div className="flex items-center space-x-4 ">
                {stats.avg > 0 && (
                  <div className="flex items-center px-0.5 py-1.5 rounded-full">
                    <span className="font-bold text-lg">
                      {stats.avg.toFixed(1)}
                    </span>
                    <StarRating
                      rating={stats.avg}
                      size="w-5 h-5"
                      color="text-yellow-500"
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    const reviewsSection =
                      document.getElementById("reviews-section");
                    reviewsSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer transition-colors hover:underline"
                >
                  {stats.total} {stats.total === 1 ? "review" : "reviews"}
                </button>
              </div>

              {/* Price */}
              <div className="flex items-end space-x-4">
                <p className="text-4xl font-bold text-gray-900">
                  ₹{displayPrice.toLocaleString()}
                </p>
                {originalPrice > displayPrice && (
                  <div className="space-y-1">
                    <p className="line-through text-gray-500 text-lg">
                      ₹{originalPrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* ⭐ FIXED: Color Selection with Image Change */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Color:{" "}
                    <span className="font-normal text-gray-900">
                      {selectedColor}
                    </span>
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-200 font-medium flex items-center gap-1.5 ${
                          selectedColor === color
                            ? "border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-md"
                            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <span>{color}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ⭐ FIXED: Size Selection */}
              {getAvailableSizesForColor.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">
                    Size:{" "}
                    <span className="font-normal text-gray-900">
                      {selectedSize ||
                        (getAvailableSizesForColor.length > 0
                          ? "Select size"
                          : "No sizes available")}
                    </span>
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {getAvailableSizesForColor.map((size) => {
                      // Find variant for this color and size to check stock
                      const sizeVariant = product.variants?.find(
                        (v) => v.color === selectedColor && v.size === size
                      );
                      const isOutOfStock =
                        sizeVariant?.stock !== undefined &&
                        sizeVariant.stock <= 0;

                      return (
                        <button
                          key={`${selectedColor}-${size}`}
                          onClick={() => setSelectedSize(size)}
                          disabled={isOutOfStock}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-200 font-medium relative ${
                            selectedSize === size
                              ? "border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-md"
                              : isOutOfStock
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                          title={
                            isOutOfStock
                              ? "Out of stock"
                              : `Select size ${size}`
                          }
                        >
                          {size}
                          {isOutOfStock && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-700 mb-3 text-lg">
                    Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Quantity */}
             <div className="space-y-2 pt-3 border-t">
  <h3 className="font-semibold text-sm text-gray-700">Quantity</h3>

  <div className="flex items-center">
    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
      <button
        onClick={decrement}
        disabled={quantity <= 1}
        className="px-3 py-2 text-gray-700 text-sm hover:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-white transition-colors"
      >
        −
      </button>

      <input
        type="number"
        value={quantity}
        onChange={handleQuantityChange}
        className="w-12 text-center py-2 text-sm border-x border-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        min="1"
        max={variant?.stock ?? 99}
      />

      <button
        onClick={increment}
        disabled={
          variant?.stock !== undefined &&
          quantity >= variant.stock
        }
        className="px-3 py-2 text-gray-700 text-sm hover:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-white transition-colors"
      >
        +
      </button>
    </div>
  </div>
</div>


              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={onAddToCart}
                  disabled={!isInStock || addingToCart || !selectedColor}
                  className={`flex-1 py-4 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 ${
                    isInStock && !addingToCart && selectedColor
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  {addingToCart
                    ? "Adding..."
                    : isInStock
                    ? "Add to Cart"
                    : "Out of Stock"}
                </button>

                <button
                  onClick={onBuyNow}
                  disabled={!isInStock || !selectedColor}
                  className={`flex-1 py-4 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 ${
                    isInStock && selectedColor
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS BLOCK */}
        <div
          id="reviews-section"
          className="bg-white rounded-2xl shadow-lg overflow-hidden mt-8"
        >
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Ratings & Reviews
              </h2>
              <button
                onClick={handleReviewButtonClick}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all duration-200 font-semibold"
              >
                Write a Review
              </button>
            </div>

            {stats.total > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:border-r lg:pr-8">
                  <div className="text-center mb-6">
                    <p className="text-6xl font-extrabold text-gray-900 mb-2">
                      {stats.avg.toFixed(1)}
                    </p>
                    <div className="flex justify-center mb-3">
                      <StarRating
                        rating={stats.avg}
                        size="w-8 h-8"
                        color="text-yellow-500"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {stats.total}{" "}
                      {stats.total === 1 ? "review" : "reviews"}
                    </p>
                  </div>

                  {/* Distribution */}
                  <div className="space-y-4">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const percentage = stats.total
                        ? (stats.dist[s] / stats.total) * 100
                        : 0;
                      return (
                        <div key={s} className="flex items-center gap-4">
                          <span className="w-8 text-gray-600">{s}★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                s >= 3
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                  : "bg-gradient-to-r from-red-400 to-pink-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-right text-gray-600 font-medium">
                            {stats.dist[s]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="space-y-6">
                    {(showAllReviews ? reviews : reviews.slice(0, 4)).map(
                      (r) => {
                        const isGuest =
                          r.userId?.startsWith("guest_") ||
                          r.userType === "guest";
                        const displayName = isGuest
                          ? "Guest User"
                          : usersMap[r.userId]?.displayName ||
                            r.userName ||
                            "Anonymous";

                        return (
                          <div
                            key={r.id}
                            className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition"
                          >
                            {/* TOP */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <StarRating rating={r.rating} size="w-5 h-5" />
                                <h4 className="font-semibold text-gray-900">
                                  {r.title}
                                </h4>
                              </div>
                              <span className="text-sm text-gray-500">
                                {r.createdAt?.toLocaleDateString?.() ||
                                  "Recently"}
                              </span>
                            </div>

                            {/* USER */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700">
                                {isGuest
                                  ? "👤"
                                  : displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {displayName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {isGuest ? "Guest User" : "Verified User"}
                                </p>
                              </div>
                            </div>

                            {/* CONTENT */}
                            <p className="text-gray-700 leading-relaxed mb-3">
                              {r.content}
                            </p>

                            {/* VERIFIED */}
                            {r.verifiedPurchase && (
                              <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                ✔ Verified Purchase
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>

                  {reviews.length > 4 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setShowAllReviews(true)}
                        className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-colors"
                      >
                        View all {reviews.length} reviews →
                      </button>
                      {showAllReviews && (
                        <div className="text-center mt-6">
                          <button
                            onClick={() => {
                              setShowAllReviews(false);

                              // 🔝 SCROLL BACK TO REVIEWS TOP
                              setTimeout(() => {
                                const reviewsSection =
                                  document.getElementById("reviews-section");
                                reviewsSection?.scrollIntoView({
                                  behavior: "smooth",
                                });
                              }, 0);
                            }}
                            className="text-gray-600 hover:underline"
                          >
                            Show less reviews ↑
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p className="text-gray-500 text-lg">
                  No reviews yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 🛒 FIXED RELATED PRODUCTS SECTION */}
        <RelatedProducts
          categoryId={product.category || product.categoryId}
          currentProductId={productId}
          source={source}
          storeLabel={storeLabel}
        />
      </div>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40"
        aria-label="Scroll to top"
      >
        ↑
      </button>

      {/* Add Enhanced CSS Animations */}
      <style jsx="true">{`
        @keyframes toastSlideIn {
          0% {
            transform: translateX(100%) rotate(5deg);
            opacity: 0;
          }
          70% {
            transform: translateX(-10%) rotate(-2deg);
            opacity: 1;
          }
          100% {
            transform: translateX(0) rotate(0);
            opacity: 1;
          }
        }

        @keyframes toastFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-progress-bar {
          animation: progressBar 4s linear forwards;
        }

        /* Button click animation */
        .clicked {
          animation: buttonClick 0.3s ease-out;
        }

        @keyframes buttonClick {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #db2777);
        }

        /* Line clamp styles for related products */
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;
