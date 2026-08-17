"use client";

import { useEffect, useRef } from "react";
import { usePosStore } from "@/stores/pos-store";

interface BarcodeListenerProps {
  products: any[];
}

export function BarcodeListener({ products }: BarcodeListenerProps) {
  const addToCart = usePosStore((state) => state.addToCart);
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentTime = Date.now();
      // Barcode scanners type very fast (usually < 30ms between keystrokes)
      // If it's been more than 100ms, assume it's manual typing and reset buffer
      if (currentTime - lastKeyTimeRef.current > 100) {
        bufferRef.current = "";
      }
      
      lastKeyTimeRef.current = currentTime;

      if (e.key === "Enter") {
        const barcode = bufferRef.current.trim();
        if (barcode.length > 3) {
          // Find product by barcode
          const product = products.find((p) => p.barcode === barcode);
          if (product) {
            addToCart({
              productId: product.id,
              name: product.name,
              price: product.basePrice,
              quantity: 1,
              taxRate: product.taxRate || 16, // Assuming 16 fallback or fetch from branch
            });
          } else {
            console.warn(`Barcode ${barcode} not found.`);
            // You could pop a toast here
          }
        }
        bufferRef.current = ""; // Reset after Enter
      } else if (e.key.length === 1) {
        // Only append single characters (avoiding Shift, Ctrl, etc.)
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, addToCart]);

  return null; // This is a logic-only component
}
