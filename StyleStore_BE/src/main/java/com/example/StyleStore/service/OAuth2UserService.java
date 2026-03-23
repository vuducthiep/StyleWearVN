package com.example.StyleStore.service;

import com.example.StyleStore.dto.AuthResponse;
import com.example.StyleStore.model.Role;
import com.example.StyleStore.model.User;
import com.example.StyleStore.model.enums.UserStatus;
import com.example.StyleStore.model.Cart;
import com.example.StyleStore.repository.UserRepository;
import com.example.StyleStore.repository.CartRepository;
import com.example.StyleStore.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final CartRepository cartRepository;
    private final RoleRepository roleRepository;

    @Transactional
    public AuthResponse processOAuth2User(String email, String fullName, String picture) {
        try {
            // Kiểm tra user đã tồn tại chưa
            Optional<User> existingUser = userRepository.findByEmail(email);
                Role userRole = roleRepository.findByName("USER")
                    .orElseThrow(() -> new RuntimeException("Role USER không tồn tại"));

            User user;
            if (existingUser.isPresent()) {
                // Update user nếu đã tồn tại
                user = existingUser.get();
                if (fullName != null && !fullName.isEmpty()) {
                    user.setFullName(fullName);
                }
                user.setUpdatedAt(LocalDateTime.now());
                log.info("Updated existing OAuth2 user: {}", email);
            } else {
                // Tạo user mới nếu chưa tồn tại
                user = new User();
                user.setEmail(email);
                user.setFullName(fullName != null ? fullName : email);
                user.setPassword(""); // OAuth2 users không có password
                user.setRole(userRole);
                user.setStatus(UserStatus.ACTIVE);
                user.setPhoneNumber(""); // Default empty
                user.setGender(""); // Default empty
                user.setAddress(""); // Default empty
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                log.info("Created new OAuth2 user: {}", email);
            }

            user = userRepository.save(user);

            // Nếu user mới tạo từ OAuth2, tạo luôn giỏ hàng trống đi kèm
            if (user.getCart() == null) {
                Cart cart = Cart.builder()
                        .user(user)
                        .build();
                cartRepository.save(cart);
            }

            // Tạo JWT token
            String jwtToken = jwtService.generateTokenFromOAuth2User(email, user.getFullName());

            return new AuthResponse(
                    jwtToken,
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole().getName());
        } catch (Exception e) {
            log.error("Error processing OAuth2 user: {}", email, e);
            throw new RuntimeException("Failed to process OAuth2 user", e);
        }
    }
}
