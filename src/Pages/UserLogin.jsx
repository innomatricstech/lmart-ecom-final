import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../../firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useWishlist } from "../context/WishlistContext";

// User storage utility
const storeUserData = (userData, uid) => {
  localStorage.setItem("userData", JSON.stringify(userData));
  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("token", uid);
  localStorage.setItem("isLoggedIn", "true");
};

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleWishlist } = useWishlist();

  // ✅ Scroll to top when login page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      let userData;
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        userData = {
          name: user.displayName || formData.email.split("@")[0],
          email: user.email,
          uid: user.uid,
          createdAt: new Date(),
          wishlist: [],
        };
        await setDoc(userRef, userData);
      }

      storeUserData(userData, user.uid);

      const { state } = location;

      if (state?.reviewRedirect) {
        navigate(state.from || `/product/${state.productId}`, {
          state: {
            showReviewModal: true,
            productId: state.productId,
            productName: state.productName,
          },
        });
      } else if (state?.wishlistRedirect) {
        if (state?.product) {
          setTimeout(() => {
            toggleWishlist(state.product);
            alert(`❤️ "${state.product.name}" added to your wishlist!`);
          }, 500);

          navigate(state.from || "/", {
            state: { productName: state.product.name },
          });
        } else {
          navigate("/wishlist");
        }
      } else {
        navigate(state?.from || "/");
      }
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-12"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3"
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-purple-600 text-white font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-purple-600"
              >
                Forgot password?
              </button>
            </div>

            <div className="text-center text-sm border-t pt-4">
              Don’t have an account?
              <button
                type="button"
                className="text-purple-600 font-semibold ml-1"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  navigate("/register");
                }}
              >
                Sign up here
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
