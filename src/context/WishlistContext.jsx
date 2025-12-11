import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
<<<<<<< HEAD
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
=======
import { getAuth, onAuthStateChanged } from "firebase/auth";
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const auth = getAuth();

  const [authUser, setAuthUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  // ✅ Enhanced isLoggedIn - checks both Firebase auth AND localStorage
  const isLoggedIn = !!authUser || !!localStorage.getItem("token");

=======
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);

      if (user) {
<<<<<<< HEAD
        // User is logged in via Firebase - load their wishlist
=======
        // User is logged in - load their wishlist
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setWishlist(userData.wishlist || []);
          } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, { wishlist: [] });
            setWishlist([]);
          }
        } catch (error) {
          console.error("Error loading wishlist:", error);
          setWishlist([]);
        }
      } else {
<<<<<<< HEAD
        // User is logged out - check localStorage for manual login
        const token = localStorage.getItem("token");
        if (token) {
          // If token exists in localStorage, user is manually logged in
          // Load wishlist from localStorage
          const storedWishlist = localStorage.getItem("wishlist");
          if (storedWishlist) {
            try {
              setWishlist(JSON.parse(storedWishlist));
            } catch (e) {
              console.error("Error parsing stored wishlist:", e);
              setWishlist([]);
            }
          } else {
            setWishlist([]);
          }
        } else {
          // No Firebase auth AND no localStorage token = truly logged out
          setWishlist([]);
        }
=======
        // User is logged out - clear wishlist
        setWishlist([]);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
<<<<<<< HEAD
  }, [auth]);

  // Sync localStorage token with Firebase auth
  useEffect(() => {
    const checkLocalStorage = () => {
      const token = localStorage.getItem("token");
      if (!token && authUser) {
        // If Firebase user exists but no localStorage token, sync it
        localStorage.setItem("token", authUser.uid);
      }
    };
    
    checkLocalStorage();
  }, [authUser]);

  // Save wishlist to appropriate location
  useEffect(() => {
    if (loading) return;

    const saveWishlist = async () => {
      if (authUser) {
        // Save to Firestore if Firebase authenticated
        try {
          const userDocRef = doc(db, "users", authUser.uid);
          await setDoc(userDocRef, { wishlist }, { merge: true });
        } catch (error) {
          console.error("Error saving wishlist to Firestore:", error);
        }
      } else {
        // Save to localStorage if manually logged in
        try {
          localStorage.setItem("wishlist", JSON.stringify(wishlist));
        } catch (e) {
          console.error("Error saving wishlist to localStorage:", e);
        }
=======
  }, []);

  // Save wishlist to Firestore whenever it changes
  useEffect(() => {
    if (!authUser || loading) return;

    const saveWishlist = async () => {
      try {
        const userDocRef = doc(db, "users", authUser.uid);
        await setDoc(userDocRef, { wishlist }, { merge: true });
      } catch (error) {
        console.error("Error saving wishlist:", error);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      }
    };

    saveWishlist();
  }, [wishlist, authUser, loading]);

<<<<<<< HEAD
  // ✅ Toggle wishlist function - UPDATED with strict login check
  const toggleWishlist = (product) => {
    // ✅ STRICT CHECK: User must be logged in via Firebase OR localStorage
    const token = localStorage.getItem("token");
    const firebaseUser = authUser;
    
    if (!token && !firebaseUser) {
      console.log("❌ User not logged in, cannot add to wishlist");
      return false; // User not logged in, prevent addition
    }

    console.log("✅ User is logged in, toggling wishlist for product:", product.name);
    
=======
  // Toggle wishlist function
  const toggleWishlist = (product) => {
    if (!authUser) {
      return false; // User not logged in
    }

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    setWishlist((prevWishlist) => {
      const isAlreadyInWishlist = prevWishlist.some(item => item.id === product.id);
      
      if (isAlreadyInWishlist) {
        // Remove from wishlist
<<<<<<< HEAD
        console.log("🗑️ Removing from wishlist");
        return prevWishlist.filter(item => item.id !== product.id);
      } else {
        // Add to wishlist
        console.log("❤️ Adding to wishlist");
=======
        return prevWishlist.filter(item => item.id !== product.id);
      } else {
        // Add to wishlist
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        return [...prevWishlist, {
          id: product.id,
          name: product.name,
          price: product.price || product.finalPrice || 0,
          image: product.image,
          originalPrice: product.originalPrice,
          discount: product.discount,
<<<<<<< HEAD
          rating: product.rating,
          addedAt: new Date().toISOString()
=======
          rating: product.rating
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        }];
      }
    });
    
<<<<<<< HEAD
    return true; // Successfully toggled
  };

  // ✅ Check if product is in wishlist - UPDATED
  const isProductInWishlist = (productId) => {
    // ✅ Only check if user is logged in
    const token = localStorage.getItem("token");
    const firebaseUser = authUser;
    
    if (!token && !firebaseUser) {
      return false;
    }
    
    return wishlist.some(item => item.id === productId);
  };

  // ✅ Logout function to clear everything
  const logout = async () => {
    try {
      // Sign out from Firebase if authenticated
      if (authUser) {
        await signOut(auth);
      }
      
      // Clear all localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("wishlist");
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      localStorage.removeItem("isLoggedIn");
      
      // Clear state
      setWishlist([]);
      setAuthUser(null);
      
      console.log("✅ Logout successful, all data cleared");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // ✅ Get wishlist count
  const getWishlistCount = () => {
    return wishlist.length;
  };

  // ✅ Clear wishlist (for testing)
  const clearWishlist = () => {
    setWishlist([]);
=======
    return true;
  };

  const isProductInWishlist = (productId) => {
    return authUser ? wishlist.some(item => item.id === productId) : false;
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isProductInWishlist,
<<<<<<< HEAD
        getWishlistCount,
        clearWishlist,
        loading,
        authUser,
        isLoggedIn, // ✅ EXPOSED: Now accessible to all components
        logout
=======
        loading,
        authUser,
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);