package com.example.StyleStore.service;

import com.example.StyleStore.model.Cart;
import com.example.StyleStore.model.CartItem;

public interface CartService {
    Cart getCartByUserId(Long userId);
    CartItem addToCart(Long userId, Long productId, Long sizeId, Integer quantity);
    void removeFromCart(Long userId, Long cartItemId);
    CartItem updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity);
    void clearCart(Long userId);
}
