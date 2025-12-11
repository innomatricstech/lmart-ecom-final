<<<<<<< HEAD
// MyOrders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import emailjs from "@emailjs/browser";

/**
 * MyOrders.jsx
 *
 * - Shows orders from users/{userId}/orders only.
 * - If you save an Oldee purchase (see saveOldeePurchase below) it will appear here
 *   with image (if you include imageURLs[0] when saving).
 *
 * Usage:
 * - Replace your MyOrders.jsx with this file.
 * - From OldeeProductDetails (or your checkout success), call:
 *
 *    import { saveOldeePurchase } from 'path/to/MyOrders.jsx';
 *
 *    // after COD or UPI success:
 *    await saveOldeePurchase(userId, productObj, { method: 'COD', paymentId: null, status: 'confirmed' });
 *
 *  Make sure `productObj` contains `imageURLs` array (or `image`) so image displays.
 */

// -----------------------------
// EmailJS (return/cancel templates)
const EMAILJS_SERVICE_ID = "service_v61ct8q";
const EMAILJS_TEMPLATE_ID = "template_484qw3o";
const EMAILJS_PUBLIC_KEY = "3oPaXcWIwr2sMfais";

// -----------------------------
// Helper: Save Oldee purchase to user's orders
// Call this from Oldee checkout success (COD or after UPI success)
export async function saveOldeePurchase(userId, product, paymentInfo = {}) {
  /**
   * product example:
   * {
   *   id, name, imageURLs: [url1, url2], price, offerPrice, sellerId, seller: {}
   * }
   *
   * paymentInfo: { method: 'COD'|'UPI'|'ONLINE', paymentId: string, status: 'confirmed' }
   */
  if (!userId) throw new Error("Missing userId for saving Oldee purchase");

  const orderDoc = {
    orderId: `OLDEE-${Date.now()}`,
    type: "oldee",
    marketplace: "oldee",
    createdAt: Timestamp.now(),

    items: [
      {
        productId: product.id,
        name: product.name,
        image:
          product.image ||
          product.imageUrl ||
          product.imageURLs?.[0] ||
          product.imageUrls?.[0] ||
          null, // Ensure image is saved for display
        price: product.offerPrice ?? product.price ?? 0,
        quantity: 1,
        sellerId: product.sellerId ?? product.seller?.uid ?? null,
        seller: product.seller ?? null,
      },
    ],

    amount: product.offerPrice ?? product.price ?? 0,
    paymentMethod: paymentInfo.method ?? "COD",
    paymentId: paymentInfo.paymentId ?? null,
    status: paymentInfo.status === "confirmed" ? "confirmed" : "confirmed",
  };

  const ordersRef = collection(db, "users", userId, "orders");
  const added = await addDoc(ordersRef, orderDoc);

  // write back the generated id for convenience
  await updateDoc(doc(db, "users", userId, "orders", added.id), {
    firestoreId: added.id,
  });

  return added.id;
}

// -----------------------------
// ReturnOrderForm Component
// -----------------------------
=======
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, doc, updateDoc, Timestamp, addDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';
import emailjs from "@emailjs/browser";  

// ----------------------------------------------------
//  RETURN ORDER FORM  (COMPLETE WORKING VERSION)
// ----------------------------------------------------

const EMAILJS_SERVICE_ID = "service_v61ct8q";
const EMAILJS_TEMPLATE_ID = "template_484qw3o"; 
const EMAILJS_PUBLIC_KEY = "3oPaXcWIwr2sMfais";

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
const ReturnOrderForm = ({ order, userId, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const returnReasons = [
    "Product damaged/defective",
    "Wrong item received",
    "Size/fit issue",
    "Quality not as expected",
    "Changed my mind",
    "Other",
  ];

<<<<<<< HEAD
  const sendReturnEmail = async () => {
    let itemsList = "";
    (order.items || []).forEach((item) => {
      itemsList += `• ${item.name}\n  Qty: ${item.quantity}\n  Price: ₹${item.price}\n\n`;
    });

    const params = {
      email_type_cancel: false,
      email_type_return: true,
      email_title: "Return Request Submitted",
      header_color: "#ff8800",
      to_name: order.customerInfo?.name || "Customer",
      to_email: order.customerInfo?.email || "noemail@domain.com",
      order_id: order.orderId,
      total_amount: (order.amount ?? 0).toFixed(2),
      reason,
      description: description || "No additional details provided.",
      requested_at: new Date().toLocaleString(),
      items: itemsList,
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        params,
        EMAILJS_PUBLIC_KEY
      );
      console.log("✅ Return Email Sent");
    } catch (err) {
      console.error("❌ Return Email Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
=======
  // 📧 SEND RETURN EMAIL
// 📧 SEND RETURN EMAIL (Using unified template)
const sendReturnEmail = async () => {
  let itemsList = "";
  order.items.forEach((item) => {
    itemsList += `• ${item.name}\n  Qty: ${item.quantity}\n  Price: ₹${item.price}\n\n`;
  });

  const params = {
    // --- Required for Unified Template ---
    email_type_cancel: false,   // Not a cancel email
    email_type_return: true,    // This is a return email

    email_title: "Return Request Submitted",
    header_color: "#ff8800",

    // --- Common Fields ---
    to_name: order.customerInfo?.name || "Customer",
    to_email: order.customerInfo?.email || "noemail@domain.com",

    order_id: order.orderId,
    total_amount: order.amount?.toFixed(2),

    // --- Return Specific ---
    reason: reason,
    description: description || "No additional details provided.",
    requested_at: new Date().toLocaleString(),

    // --- Items ---
    items: itemsList,
  };

  console.log("📤 Sending Return Email:", params);

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,  // SAME template as cancel
      params,
      EMAILJS_PUBLIC_KEY
    );
    console.log("✅ Return Email Sent (Unified Template)");
  } catch (err) {
    console.error("❌ Email Error:", err);
  }
};


  // 📝 HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    if (!reason) {
      setError("Please select a return reason");
      return;
    }
<<<<<<< HEAD
=======

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    setLoading(true);
    setError("");

    try {
<<<<<<< HEAD
      const returnRef = collection(db, "users", userId, "returnRequests");
=======
      // 1️⃣ Save Return Request in Firestore
      const returnRef = collection(db, "users", userId, "returnRequests");

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      const returnData = {
        orderId: order.orderId,
        firestoreOrderId: order.id,
        reason,
        description,
        requestedAt: Timestamp.now(),
        status: "pending",
<<<<<<< HEAD
        items: (order.items || []).map((it) => ({ ...it, sellerId: it.sellerId || "Unknown" })),
=======
        items: order.items.map((it) => ({
          ...it,
          sellerId: it.sellerId || "Unknown",
        })),
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        totalAmount: order.amount,
        customerInfo: order.customerInfo || {},
      };

      const newDoc = await addDoc(returnRef, returnData);
<<<<<<< HEAD
      await updateDoc(doc(db, "users", userId, "returnRequests", newDoc.id), {
        returnRequestId: newDoc.id,
      });

      await updateDoc(doc(db, "users", userId, "orders", order.id), {
=======

      await updateDoc(newDoc, { returnRequestId: newDoc.id });

      // 2️⃣ Update main order status
      const orderRef = doc(db, "users", userId, "orders", order.id);
      await updateDoc(orderRef, {
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        status: "return_requested",
        returnRequestId: newDoc.id,
        updatedAt: Timestamp.now(),
        returnRequest: {
          reason,
          description,
          status: "pending",
          requestedAt: Timestamp.now(),
        },
      });

<<<<<<< HEAD
      await sendReturnEmail();

      onSuccess && onSuccess();
      onClose && onClose();
    } catch (err) {
      console.error("Return submit error:", err);
=======
      // 3️⃣ Send Email Notification
      await sendReturnEmail();

      // 4️⃣ UI update
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      setError("Failed to submit return request");
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Return Order</h3>
          <button onClick={onClose} className="text-xl">&times;</button>
        </div>

        <div className="bg-blue-50 p-3 rounded mb-4">
          <p className="font-semibold">Order ID: {order.orderId}</p>
          <p className="text-sm text-gray-600">
            Items: {(order.items || []).map((i) => i.name).join(", ")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Reason *</label>
            <div className="space-y-1">
              {returnReasons.map((r) => (
                <label key={r} className="flex items-center">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="mr-2"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              className="w-full p-2 border rounded"
            />
          </div>

          {error && <div className="text-red-600 p-2 bg-red-100 rounded">{error}</div>}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded p-2">Cancel</button>
            <button type="submit" className="flex-1 bg-orange-600 text-white rounded p-2">
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
=======
  // ----------------------------------------------------
  //  RETURN FORM UI
  // ----------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold">Return Order</h2>
            <button onClick={onClose} className="text-xl">&times;</button>
          </div>

          {/* ORDER SUMMARY */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="font-semibold">Order ID: {order.orderId}</p>
            <p className="text-sm text-gray-600">
              Items: {order.items.map((i) => i.name).join(", ")}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">

              {/* REASON */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Reason *</label>
                <div className="space-y-1">
                  {returnReasons.map((r) => (
                    <label key={r} className="flex items-center">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="mr-2"
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Details</label>
                <textarea
                  value={description || ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>

              {/* POLICY */}
              <div className="bg-yellow-50 p-3 border border-yellow-200 rounded text-sm">
                <p className="text-yellow-800">
                  ⓘ Return Policy:
                  <ul className="list-disc list-inside mt-1">
                    <li>Valid within 7 days of delivery</li>
                    <li>Product must be unused</li>
                    <li>Refund processed in 5–7 business days</li>
                  </ul>
                </p>
              </div>

              {/* ERROR */}
              {error && <div className="p-2 bg-red-100 text-red-700 rounded">{error}</div>}

              {/* BUTTONS */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border p-2 rounded"
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 text-white p-2 rounded hover:bg-orange-700"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>

            </div>
          </form>

        </div>
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      </div>
    </div>
  );
};

<<<<<<< HEAD
// -----------------------------
// CancelOrderForm Component
// -----------------------------
=======

// Cancel Order Form Component
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
const CancelOrderForm = ({ order, userId, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cancelReasons = [
    "Found better price elsewhere",
    "Ordered by mistake",
    "Delivery time too long",
    "Changed my mind",
    "Payment issues",
    "Other",
  ];

<<<<<<< HEAD
  const EMAILJS_CANCEL_SERVICE_ID = "service_v61ct8q";
  const EMAILJS_CANCEL_TEMPLATE_ID = "template_484qw3o";
  const EMAILJS_CANCEL_PUBLIC_KEY = "R9vRtLgQ11-S8rVaZ";

  const sendCancelEmail = async (params) => {
    try {
      await emailjs.send(
        EMAILJS_CANCEL_SERVICE_ID,
        EMAILJS_CANCEL_TEMPLATE_ID,
        params,
        EMAILJS_CANCEL_PUBLIC_KEY
      );
      console.log("Cancel email sent");
    } catch (err) {
      console.error("Cancel email error", err);
=======
  // ✅ Correct EmailJS Config
  const EMAILJS_SERVICE_ID = "service_v61ct8q";
  const EMAILJS_CANCEL_TEMPLATE_ID = "template_484qw3o";
  const EMAILJS_PUBLIC_KEY = "R9vRtLgQ11-S8rVaZ";

  const sendCancelEmail = async (params) => {
    try {
      const res = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_CANCEL_TEMPLATE_ID,
        params,
        EMAILJS_PUBLIC_KEY
      );

      console.log("📧 Cancel email sent:", res);
    } catch (err) {
      console.error("❌ Cancel Email Error:", err);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
=======

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    if (!reason) {
      setError("Please select a cancellation reason.");
      return;
    }
<<<<<<< HEAD
=======

    const finalReason = reason === "Other" ? otherReason : reason;

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    setLoading(true);
    setError("");

    try {
<<<<<<< HEAD
      const finalReason = reason === "Other" ? otherReason : reason;

      const formattedItems = (order.items || [])
        .map((item) => {
          const color = item.selectedColor || item.colors?.[0] || "-";
          const size = item.selectedSize || "-";
          return `• ${item.name}\n  Color: ${color}\n  Size: ${size}\n  Qty: ${item.quantity}\n  Price: ₹${item.price}`;
        })
        .join("\n\n");

=======
      console.log("Cancel Order Items:");
      order.items.forEach((item, index) => {
        console.group(`Item ${index + 1}`);
        console.log("Name:", item.name);
        console.log("Price:", item.price);
        console.log("Quantity:", item.quantity);
        console.log("Color:", item.selectedColor || item.colors?.[0] || "-");
        console.log("Size:", item.selectedSize || "-");
        console.groupEnd();
      });

      // Format items for email
      const formattedItems = order.items
        .map((item) => {
          const color = item.selectedColor || item.colors?.[0] || "-";
          const size = item.selectedSize || "-";

          return `• ${item.name}
  Color: ${color}
  Size: ${size}
  Qty: ${item.quantity}
  Price: ₹${item.price}`;
        })
        .join("\n\n");

      const cancelledAt = new Date();

      // Email parameters
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      const cancelEmailParams = {
        to_name: order.customerInfo?.name || "Customer",
        email: order.customerInfo?.email,
        order_id: order.orderId,
        reason: finalReason,
<<<<<<< HEAD
        amount: (order.amount ?? 0).toFixed(2),
        cancelled_at: new Date().toLocaleString(),
        items: formattedItems,
      };

      await sendCancelEmail(cancelEmailParams);

      const cancellationRef = collection(db, "users", userId, "cancellationRequests");
=======
        amount: order.amount?.toFixed(2),
        cancelled_at: cancelledAt.toLocaleString(),
        items: formattedItems,
      };

      console.log("📤 Sending cancel email with:", cancelEmailParams);

      // Send email
      await sendCancelEmail(cancelEmailParams);

      // Save cancellation in Firestore
      const cancellationCollectionRef = collection(
        db,
        "users",
        userId,
        "cancellationRequests"
      );

>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      const cancellationData = {
        orderId: order.orderId,
        firestoreOrderId: order.id,
        reason: finalReason,
        requestedAt: Timestamp.now(),
        status: "completed",
        amount: order.amount,
<<<<<<< HEAD
        items: (order.items || []).map((it) => ({ ...it, sellerId: it.sellerId || "Unknown" })),
        paymentMethod: order.paymentMethod || null,
      };

      const newCancellation = await addDoc(cancellationRef, cancellationData);

      await updateDoc(doc(db, "users", userId, "orders", order.id), {
        status: "cancelled",
        cancellationId: newCancellation.id,
=======
        items: order.items.map((item) => ({
          ...item,
          sellerId: item.sellerId || "Unknown",
        })),
        paymentMethod: order.paymentMethod,
      };

      const newCancellationRef = await addDoc(
        cancellationCollectionRef,
        cancellationData
      );

      // Update main order status
      const orderRef = doc(db, "users", userId, "orders", order.id);
      await updateDoc(orderRef, {
        status: "cancelled",
        cancellationId: newCancellationRef.id,
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        cancellation: {
          reason: finalReason,
          cancelledAt: Timestamp.now(),
        },
        updatedAt: Timestamp.now(),
      });

<<<<<<< HEAD
      onSuccess && onSuccess();
      onClose && onClose();
=======
      onSuccess();
      onClose();
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError("Failed to cancel order. Try again.");
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Cancel Order</h3>
          <button onClick={onClose} className="text-xl">&times;</button>
        </div>

        <div className="bg-blue-50 p-3 rounded mb-4">
          <p className="font-semibold">Order ID: {order.orderId}</p>
          <p className="text-sm text-gray-600">Total: ₹{(order.amount ?? 0).toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Why do you want to cancel?</label>
            <div className="space-y-2">
              {cancelReasons.map((r) => (
                <label key={r} className="flex items-center">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="mr-2"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {reason === "Other" && (
            <input
              type="text"
              placeholder="Please specify"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          )}

          {error && <div className="text-red-600 p-2 bg-red-100 rounded">{error}</div>}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded p-2">Go Back</button>
            <button type="submit" className="flex-1 bg-red-600 text-white rounded p-2">
              {loading ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>
=======

  return (
    /* Your UI stays the same */
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Cancel Order</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>

          {/* ORDER SUMMARY */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold">Order ID: {order.orderId}</p>
            <p className="text-sm text-gray-600">
              Total Amount: ₹{order.amount?.toFixed(2)}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* REASONS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Why do you want to cancel? *
                </label>
                <div className="space-y-2">
                  {cancelReasons.map((cancelReason) => (
                    <label key={cancelReason} className="flex items-center">
                      <input
                        type="radio"
                        name="reason"
                        value={cancelReason}
                        checked={reason === cancelReason}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-4 w-4 text-red-600"
                      />
                      <span className="ml-2">{cancelReason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* OTHER REASON */}
              {reason === "Other" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Please specify:
                  </label>
                  <input
                    type="text"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              )}

              {/* ERROR */}
              {error && (
                <div className="bg-red-100 text-red-700 p-2 rounded">
                  {error}
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg"
                >
                  {loading ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </form>
        </div>
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      </div>
    </div>
  );
};

<<<<<<< HEAD
// -----------------------------
// Main MyOrders Component
// -----------------------------
=======

// Main MyOrders Component
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
<<<<<<< HEAD
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const currentUserId = localStorage.getItem("token");

  const fetchOrders = async () => {
    setLoading(true);
    if (!currentUserId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const ordersRef = collection(db, "users", currentUserId, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(list);

      // show possible success message from session (checkout)
      const orderSuccessData = sessionStorage.getItem("orderSuccessData");
      if (orderSuccessData) {
        try {
          const parsed = JSON.parse(orderSuccessData);
          setSuccessMessage(`🎉 Order #${parsed.orderId} placed successfully!`);
          sessionStorage.removeItem("orderSuccessData");
          setTimeout(() => setSuccessMessage(""), 5000);
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
=======
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  
  const currentUserId = localStorage.getItem('token');

  const fetchOrders = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    
    try {
      const ordersSubCollectionRef = collection(db, "users", currentUserId, "orders");
      const q = query(
        ordersSubCollectionRef,
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || Timestamp.now()
      }));
      
      setOrders(fetchedOrders);
      
      // Check for success message from checkout
      const orderSuccessData = sessionStorage.getItem("orderSuccessData");
      if (orderSuccessData) {
        const orderData = JSON.parse(orderSuccessData);
        setSuccessMessage(`🎉 Order #${orderData.orderId} placed successfully!`);
        sessionStorage.removeItem("orderSuccessData");
        
        // Auto-remove success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
<<<<<<< HEAD
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const isOrderReturnable = (order) => {
    const status = (order.status || "").toLowerCase();
    const nonReturnable = ["cancelled", "returned", "return_requested", "return_rejected"];
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt ? new Date(order.createdAt) : new Date());
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return !nonReturnable.includes(status) && status === "delivered" && orderDate > sevenDaysAgo;
  };

  const isOrderCancellable = (order) => {
    const status = (order.status || "").toLowerCase();
    const cancellable = ["confirmed", "processing", "pending"];
    return cancellable.includes(status);
=======
  }, [currentUserId]);

  const isOrderReturnable = (order) => {
    const status = order.status?.toLowerCase();
    const nonReturnableStatuses = ['cancelled', 'returned', 'return_requested', 'return_rejected'];
    
    // Check if order was delivered within last 7 days
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return !nonReturnableStatuses.includes(status) && 
           status === 'delivered' && 
           orderDate > sevenDaysAgo;
  };

  const isOrderCancellable = (order) => {
    const status = order.status?.toLowerCase();
    const cancellableStatuses = ['confirmed', 'processing', 'pending'];
    return cancellableStatuses.includes(status);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
  };

  const handleReturnClick = (order) => {
    setSelectedOrder(order);
    setShowReturnForm(true);
  };

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setShowCancelForm(true);
  };

  const handleReturnSuccess = () => {
    fetchOrders();
<<<<<<< HEAD
    setSuccessMessage("Return request submitted successfully! We will contact you within 24 hours.");
    setTimeout(() => setSuccessMessage(""), 5000);
=======
    setSuccessMessage('Return request submitted successfully! We will contact you within 24 hours.');
    setTimeout(() => setSuccessMessage(''), 5000);
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
  };

  const handleCancelSuccess = () => {
    fetchOrders();
<<<<<<< HEAD
    setSuccessMessage("Order cancelled successfully! Refund will be processed within 5-7 business days.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const getStatusBadgeColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-indigo-100 text-indigo-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "return_requested":
      case "returned":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
=======
    setSuccessMessage('Order cancelled successfully! Refund will be processed within 5-7 business days.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-indigo-100 text-indigo-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'return_requested':
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
    }
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
=======
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }
<<<<<<< HEAD

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
          <h2 className="text-2xl font-bold mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your orders.</p>
          <button onClick={() => navigate("/login")} className="px-6 py-2 bg-purple-600 text-white rounded">
=======
  
  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
            Go to Login
          </button>
        </div>
      </div>
    );
  }
<<<<<<< HEAD

=======
  
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-6">My Orders</h1>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4 text-gray-300">📦</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">No Orders Yet</h2>
<<<<<<< HEAD
            <p className="text-gray-500 mb-8">You haven't placed any orders yet. When you buy something (including Oldee purchases), it'll show up here.</p>
            <button onClick={() => navigate("/")} className="px-6 py-3 bg-purple-600 text-white rounded">
=======
            <p className="text-gray-500 mb-8">You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto p-4">
<<<<<<< HEAD
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded border border-green-200">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{successMessage}</span>
=======
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-200">
            <div className="flex items-center">
              <span className="text-green-600 mr-2">✓</span>
              {successMessage}
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
<<<<<<< HEAD
        <p className="text-gray-600 mb-8">Manage all your purchases (including Oldee purchases saved after checkout)</p>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{orders.filter(o => (o.status || "").toLowerCase() === "delivered").length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Processing</p>
            <p className="text-2xl font-bold text-blue-600">{orders.filter(o => ["confirmed","processing","shipped"].includes((o.status || "").toLowerCase())).length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Cancelled/Returned</p>
            <p className="text-2xl font-bold text-red-600">{orders.filter(o => ["cancelled","returned"].includes((o.status || "").toLowerCase())).length}</p>
=======
        <p className="text-gray-600 mb-8">View and manage all your orders in one place</p>
        
        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-gray-500 text-sm">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status?.toLowerCase() === 'delivered').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-gray-500 text-sm">Processing</p>
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter(o => ['confirmed', 'processing', 'shipped'].includes(o.status?.toLowerCase())).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <p className="text-gray-500 text-sm">Cancelled/Returned</p>
            <p className="text-2xl font-bold text-red-600">
              {orders.filter(o => ['cancelled', 'returned'].includes(o.status?.toLowerCase())).length}
            </p>
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => {
<<<<<<< HEAD
            const status = (order.status || "confirmed").toLowerCase();
            const canReturn = isOrderReturnable(order);
            const canCancel = isOrderCancellable(order);

            return (
              <div key={order.id} className="bg-white rounded-xl p-6 shadow border border-gray-100">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <p className="font-semibold text-lg">Order ID: {order.orderId || `ORD-${(order.id || "").substring(0,8)}`}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <p>
                        Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : (order.createdAt ? new Date(order.createdAt).toLocaleString() : "")}
                      </p>
                      {order.paymentMethod && <p>Payment: {order.paymentMethod.toUpperCase()}</p>}
                      {order.marketplace && <p className="italic">Marketplace: {order.marketplace}</p>}
=======
            const status = order.status?.toLowerCase() || 'confirmed';
            const canReturn = isOrderReturnable(order);
            const canCancel = isOrderCancellable(order);
            const hasReturnRequest = status === 'return_requested';

            return (
              <div 
                key={order.id} 
                className="bg-white p-6 shadow-lg rounded-xl border border-gray-100 hover:shadow-xl transition-shadow"
              >
                {/* ORDER HEADER */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">Order ID: {order.orderId || `ORD-${order.id.substring(0, 8)}`}</p>
                    <div className="flex flex-wrap gap-4">
                      <p className="text-gray-500">
                        Date: {order.createdAt?.toDate 
                          ? order.createdAt.toDate().toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.paymentMethod && (
                        <p className="text-gray-500">
                          Payment: {order.paymentMethod.toUpperCase()}
                        </p>
                      )}
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(status)}`}>
<<<<<<< HEAD
                      {String(status).charAt(0).toUpperCase() + String(status).slice(1).replace("_", " ")}
                    </span>

                    {order.returnRequest?.reason && <p className="text-sm text-gray-600">Return Reason: {order.returnRequest.reason}</p>}
                  </div>
                </div>

                {/* Items */}
                <div className="mt-4 space-y-4">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 border-b pb-4">
                      <img
                        src={
                          item.image ||
                          item.imageUrl ||
                          (item.imageURLs && item.imageURLs[0]) ||
                          (item.imageUrls && item.imageUrls[0]) ||
                          "/placeholder-image.jpg"
                        }
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                        onError={(e) => { e.target.src = "/placeholder-image.jpg"; }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-1">
                          <p>Qty: {item.quantity ?? 1}</p>
                          <p>Price: ₹{(item.price ?? 0).toFixed(2)}</p>
                          {item.sellerId && <p className="px-2 py-0.5 bg-gray-100 rounded text-xs">Seller ID: {item.sellerId}</p>}
                          {item.selectedColor && <p>Color: {item.selectedColor}</p>}
                          {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                        </div>
                        <p className="mt-2 text-green-700 font-medium">Item Total: ₹{(((item.price ?? 0) * (item.quantity ?? 1))).toFixed(2)}</p>
=======
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </span>
                    
                    {hasReturnRequest && order.returnRequest?.reason && (
                      <p className="text-sm text-gray-600">
                        Return Reason: {order.returnRequest.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* ORDER ITEMS DISPLAY WITH SELLER ID */}
                <div className="space-y-4 mb-6">
                  {order.items?.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 border-b pb-4 last:border-0"
                    >
                      <img 
                        src={item.image || item.imageUrl || '/placeholder-image.jpg'} 
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{item.name}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          <p>Qty: {item.quantity}</p>
                          <p>Price: ₹{item.price?.toFixed(2)}</p>
                          {/* DYNAMIC SELLER ID DISPLAY */}
                          {item.sellerId && (
                            <p className="bg-gray-100 px-2 py-0.5 rounded border text-xs">
                              Seller ID: {item.sellerId}
                            </p>
                          )}
                          {item.selectedColor && (
                            <p>Color: {item.selectedColor}</p>
                          )}
                          {item.selectedSize && (
                            <p>Size: {item.selectedSize}</p>
                          )}
                          {item.selectedRam && (
                            <p>RAM: {item.selectedRam}</p>
                          )}
                        </div>
                        <p className="text-green-700 font-medium">
                          Item Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
                      </div>
                    </div>
                  ))}
                </div>

<<<<<<< HEAD
                {/* Shipping & Summary */}
                {order.customerInfo && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">Shipping Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
=======
                {/* SHIPPING INFORMATION */}
                {order.customerInfo && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Shipping Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
                      <p><span className="text-gray-500">Name:</span> {order.customerInfo.name}</p>
                      <p><span className="text-gray-500">Phone:</span> {order.customerInfo.phone}</p>
                      <p className="md:col-span-2"><span className="text-gray-500">Address:</span> {order.customerInfo.address}</p>
                      <p><span className="text-gray-500">City:</span> {order.customerInfo.city}</p>
                      <p><span className="text-gray-500">Pincode:</span> {order.customerInfo.pincode}</p>
                    </div>
                  </div>
                )}

<<<<<<< HEAD
                <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-green-600">Total: ₹{(order.amount ?? 0).toFixed(2)}</p>
                    {order.paymentId && <p className="text-sm text-gray-500">Payment ID: {String(order.paymentId).substring(0, 12)}...</p>}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {order.invoiceUrl ? (
                      <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded">View Invoice</a>
                    ) : (
                      <button onClick={() => navigate(`/invoice?orderId=${order.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded">View Invoice</button>
                    )}

                    {isOrderCancellable(order) && <button onClick={() => handleCancelClick(order)} className="px-4 py-2 bg-red-600 text-white rounded">Cancel Order</button>}

                    {isOrderReturnable(order) && <button onClick={() => handleReturnClick(order)} className="px-4 py-2 bg-orange-600 text-white rounded">Return Order</button>}

                    {status === "shipped" && <button onClick={() => navigate(`/track-order?orderId=${order.id}`)} className="px-4 py-2 bg-purple-600 text-white rounded">Track Order</button>}
=======
                {/* ORDER SUMMARY */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-6 border-t">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      Total: ₹{order.amount?.toFixed(2)}
                    </p>
                    {order.razorpayOrderId && (
                      <p className="text-gray-500 text-sm">
                        Payment ID: {order.razorpayOrderId.substring(0, 10)}...
                      </p>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex flex-wrap gap-3">
                    {order.invoiceUrl ? (
                      <a 
                        href={order.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Invoice
                      </a>
                    ) : (
                      <button 
                        onClick={() => navigate(`/invoice?orderId=${order.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Invoice
                      </button>
                    )}
                    
                    {canCancel && (
                      <button 
                        onClick={() => handleCancelClick(order)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    {canReturn && (
                      <button 
                        onClick={() => handleReturnClick(order)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Return Order
                      </button>
                    )}

                    {status === 'shipped' && (
                      <button 
                        onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Track Order
                      </button>
                    )}
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
                  </div>
                </div>
              </div>
            );
          })}
        </div>

<<<<<<< HEAD
        {/* Return & Cancellation Policy Footer */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded border">
          <h3 className="text-xl font-bold mb-4">📦 Return & Cancellation Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">Return Policy</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>7-day return window from delivery date</li>
                <li>Items must be unused and in original packaging</li>
                <li>Refunds processed within 5-7 business days</li>
                <li>Free pickup for eligible returns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cancellation Policy</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Cancel within 24 hours for instant refund</li>
                <li>Orders in 'processing' can be cancelled</li>
                <li>Shipped orders require customer support</li>
                <li>Refund method same as payment method</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modals */}
=======
        {/* MODALS */}
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
        {showReturnForm && selectedOrder && (
          <ReturnOrderForm
            order={selectedOrder}
            userId={currentUserId}
<<<<<<< HEAD
            onClose={() => { setShowReturnForm(false); setSelectedOrder(null); }}
=======
            onClose={() => {
              setShowReturnForm(false);
              setSelectedOrder(null);
            }}
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
            onSuccess={handleReturnSuccess}
          />
        )}

        {showCancelForm && selectedOrder && (
          <CancelOrderForm
            order={selectedOrder}
            userId={currentUserId}
<<<<<<< HEAD
            onClose={() => { setShowCancelForm(false); setSelectedOrder(null); }}
            onSuccess={handleCancelSuccess}
          />
        )}
=======
            onClose={() => {
              setShowCancelForm(false);
              setSelectedOrder(null);
            }}
            onSuccess={handleCancelSuccess}
          />
        )}

        {/* RETURN & CANCELLATION POLICY */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
          <h3 className="text-xl font-bold mb-4">📦 Return & Cancellation Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Return Policy
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>7-day return window from delivery date</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Items must be unused and in original packaging</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Refunds processed within 5-7 business days</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Free pickup for eligible returns</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center">
                <span className="text-red-600 mr-2">✗</span>
                Cancellation Policy
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Cancel within 24 hours for instant refund</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Orders in 'processing' can be cancelled</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Shipped orders require customer support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Refund method same as payment method</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default MyOrders;
=======
export default MyOrders;
>>>>>>> 0d8f0c98d3b48644b1f77b806ef849904452b6e8
