package com.example.StyleStore.service.impl;

import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.model.Cart;
import com.example.StyleStore.model.CartItem;
import com.example.StyleStore.model.Product;
import com.example.StyleStore.model.Size;
import com.example.StyleStore.model.User;
import com.example.StyleStore.repository.CartRepository;
import com.example.StyleStore.repository.CartItemRepository;
import com.example.StyleStore.repository.ProductRepository;
import com.example.StyleStore.repository.SizeRepository;
import com.example.StyleStore.repository.UserRepository;
import com.example.StyleStore.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final SizeRepository sizeRepository;
    private final UserRepository userRepository;

    @Override
    public Cart getCartByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        return cartRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng không tồn tại"));
    }

    @Override
    public CartItem addToCart(Long userId, Long productId, Long sizeId, Integer quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        Cart cart = getCartByUserId(userId);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

        Size size = sizeRepository.findById(sizeId)
                .orElseThrow(() -> new RuntimeException("Size không tồn tại"));

        Optional<CartItem> existingItem = cartItemRepository.findByCart_IdAndProduct_IdAndSize_Id(
                cart.getId(), productId, sizeId);

        CartItem cartItem;
        if (existingItem.isPresent()) {
            cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            cartItem.setUpdatedAt(LocalDateTime.now());
        } else {
            cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .size(size)
                    .quantity(quantity)
                    .price(product.getPrice())
                    .build();
        }

        cartItem = cartItemRepository.save(cartItem);
        updateCartTotalPrice(cart);
        return cartItem;
    }

    @Override
    public void removeFromCart(Long userId, Long cartItemId) {
        Cart cart = getCartByUserId(userId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại trong giỏ"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Không có quyền xóa sản phẩm này");
        }

        cartItemRepository.deleteById(cartItemId);
        updateCartTotalPrice(cart);
    }

    @Override
    public CartItem updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity) {
        if (quantity <= 0) {
            throw new RuntimeException("Số lượng phải lớn hơn 0");
        }

        Cart cart = getCartByUserId(userId);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại trong giỏ"));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Không có quyền cập nhật sản phẩm này");
        }

        cartItem.setQuantity(quantity);
        cartItem.setUpdatedAt(LocalDateTime.now());
        return cartItemRepository.save(cartItem);
    }

    @Override
    public void clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cartItemRepository.deleteByCart_Id(cart.getId());
        cartRepository.save(cart);
    }

    private void updateCartTotalPrice(Cart cart) {
        // totalPrice được tính tự động từ getTotalPrice()
    }
}
