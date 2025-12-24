import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import StarRating from "./StarRating";

const RelatedProducts = ({
  categoryId,
  currentProductId,
  source,
  storeLabel
}) => {
  const navigate = useNavigate();

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewsMap, setReviewsMap] = useState({});

  /* ================= FETCH REVIEWS ================= */
  const fetchProductReviews = useCallback(async (productId) => {
    try {
      const q = query(
        collection(db, "reviews"),
        where("productId", "==", productId)
      );

      const snap = await getDocs(q);

      let total = 0;
      let count = 0;
      let verifiedCount = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        if (data.rating) {
          total += Number(data.rating);
          count++;
          if (data.verifiedPurchase === true) {
            verifiedCount++;
          }
        }
      });

      return {
        avgRating: count ? Number((total / count).toFixed(1)) : 0,
        reviewCount: count,
        verifiedCount,
        hasReviews: count > 0
      };
    } catch (err) {
      console.error("Review fetch error:", err);
      return {
        avgRating: 0,
        reviewCount: 0,
        verifiedCount: 0,
        hasReviews: false
      };
    }
  }, []);

  /* ================= FETCH RELATED PRODUCTS ================= */
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!categoryId || !source) return;

      setLoading(true);

      try {
        let collectionName = "products";
        if (source === "local-market") collectionName = "localmarket";
        if (source === "printing") collectionName = "printing";

        const snap = await getDocs(collection(db, collectionName));
        const list = [];

        snap.forEach((doc) => {
          const data = doc.data();

          const productCategory =
            typeof data.category === "object"
              ? data.category.id
              : data.category;

          const currentCategory =
            typeof categoryId === "object"
              ? categoryId.id
              : categoryId;

          if (
            productCategory === currentCategory &&
            doc.id !== currentProductId
          ) {
            list.push({
              id: doc.id,
              ...data,
              name: data.name || data.productName || "Unnamed Product",
              image:
                data.imageUrls?.[0]?.url ||
                data.mainImage ||
                data.image ||
                "",
              price:
                data.offerPrice ||
                data.price ||
                data.sellingPrice ||
                0,
              originalPrice: data.originalPrice || data.price || 0,
              stock: data.stock || data.quantity || 0
            });
          }
        });

        const shuffled = list.sort(() => 0.5 - Math.random()).slice(0, 4);

        const productsWithReviews = await Promise.all(
          shuffled.map(async (product) => {
            const reviewData = await fetchProductReviews(product.id);
            return { ...product, ...reviewData };
          })
        );

        const reviewMap = {};
        productsWithReviews.forEach((p) => {
          reviewMap[p.id] = {
            avgRating: p.avgRating,
            reviewCount: p.reviewCount,
            verifiedCount: p.verifiedCount,
            hasReviews: p.hasReviews
          };
        });

        setRelatedProducts(productsWithReviews);
        setReviewsMap(reviewMap);
      } catch (err) {
        console.error("Related products error:", err);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [categoryId, currentProductId, source, fetchProductReviews]);

  if (loading || relatedProducts.length === 0) return null;

  /* ================= UI ================= */
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Related Products from {storeLabel}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {relatedProducts.map((product) => {
          const reviews = reviewsMap[product.id];

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer"
              onClick={() =>
                navigate(`/product/${product.id}`, {
                  state: { product, source }
                })
              }
            >
              {/* IMAGE */}
              <img
                src={product.image || "https://placehold.co/300x200"}
                alt={product.name}
                className="h-48 w-full object-cover rounded-t-xl"
              />

              {/* INFO */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                  {product.name}
                </h3>

                {/* ⭐ REVIEWS */}
                {reviews?.hasReviews ? (
                  <div className="mb-2">
                    <div className="flex items-center gap-1">
                      <StarRating rating={reviews.avgRating} />
                      <span className="text-sm text-gray-600">
                        ({reviews.reviewCount})
                      </span>
                    </div>

                    {reviews.verifiedCount > 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        ✔ Verified Buyer
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-2">
                    No reviews yet
                  </p>
                )}

                {/* PRICE */}
                <div className="text-lg font-bold text-gray-900">
                  ₹{product.price}
                </div>

                {/* STOCK */}
                <p
                  className={`text-sm mt-2 ${
                    product.stock > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
