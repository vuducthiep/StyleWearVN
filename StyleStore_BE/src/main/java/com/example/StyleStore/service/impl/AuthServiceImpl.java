package com.example.StyleStore.service.impl;

import com.example.StyleStore.dto.request.auth.ForgotPasswordRequest;
import com.example.StyleStore.dto.request.auth.LoginRequest;
import com.example.StyleStore.dto.request.auth.ResetPasswordRequest;
import com.example.StyleStore.dto.request.auth.RegisterRequest;
import com.example.StyleStore.dto.request.auth.VerifyOtpRequest;
import com.example.StyleStore.dto.response.AuthResponse;
import com.example.StyleStore.model.Role;
import com.example.StyleStore.model.User;
import com.example.StyleStore.model.Cart;
import com.example.StyleStore.model.enums.UserStatus;
import com.example.StyleStore.repository.UserRepository;
import com.example.StyleStore.repository.CartRepository;
import com.example.StyleStore.repository.RoleRepository;
import com.example.StyleStore.service.AuthService;
import com.example.StyleStore.service.JwtService;
import com.example.StyleStore.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.time.Duration;
import java.util.logging.Logger;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

        private static final String RESET_TOKEN_KEY_PREFIX = "reset_token:";
        private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(5);

        private final UserRepository userRepository;
        private final CartRepository cartRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final OtpService otpService;
        private final RedisTemplate<String, String> redisTemplate;
        private static final Logger logger = Logger.getLogger(AuthServiceImpl.class.getName());
        private static final Set<String> ALLOWED_GENDERS = Set.of("MALE", "FEMALE", "OTHER");

        @Override
        public AuthResponse register(RegisterRequest request) {
                if (userRepository.existsByEmail(request.email())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã tồn tại!");
                }

                otpService.verifyOtpOrThrow(request.email(), request.otp());

                String genderValue = normalizeGender(request.gender());

                Role userRole = roleRepository.findByName("USER")
                                .orElseThrow(() -> new RuntimeException("Role USER không tồn tại"));

                User user = User.builder()
                                .fullName(request.fullName())
                                .email(request.email())
                                .password(passwordEncoder.encode(request.password()))
                                .phoneNumber(request.phoneNumber())
                                .gender(genderValue)
                                .address(request.address())
                                .role(userRole)
                                .status(UserStatus.ACTIVE)
                                .build();

                userRepository.save(user);

                try {
                        Cart cart = Cart.builder()
                                        .user(user)
                                        .build();
                        cartRepository.save(cart);
                        logger.info("Giỏ hàng đã được tạo cho user: " + user.getEmail());
                } catch (Exception e) {
                        logger.severe("Lỗi khi tạo giỏ hàng cho user: " + user.getEmail() + " - " + e.getMessage());
                        throw new RuntimeException("Lỗi khi tạo giỏ hàng: " + e.getMessage(), e);
                }

                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                user.getPassword(),
                                getAuthorities(user.getRole()));

                String jwt = jwtService.generateToken(userDetails, user.getId(), user.getRole().getName());

                return new AuthResponse(jwt, user.getId(), user.getFullName(), user.getEmail(), user.getRole().getName());
        }

        @Override
        public AuthResponse login(LoginRequest request) {
                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(request.email(), request.password()));
                } catch (Exception ex) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
                }

                User user = userRepository.findByEmail(request.email())
                                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

                if (user.getStatus() != UserStatus.ACTIVE) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "Tài khoản của bạn không active. Vui lòng liên hệ quản trị viên");
                }

                UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                                user.getEmail(),
                                user.getPassword(),
                                getAuthorities(user.getRole()));

                String jwt = jwtService.generateToken(userDetails, user.getId(), user.getRole().getName());

                return new AuthResponse(jwt, user.getId(), user.getFullName(), user.getEmail(), user.getRole().getName());
        }

        @Override
        public void forgotPassword(ForgotPasswordRequest request) {
                otpService.sendOtpForForgotPassword(request.email());
        }

        @Override
        public String verifyOtp(VerifyOtpRequest request) {
                String email = normalizeEmail(request.email());
                otpService.verifyForgotPasswordOtpOrThrow(email, request.otp());

                String resetToken = UUID.randomUUID().toString();
                redisTemplate.opsForValue().set(resetTokenKey(resetToken), email, RESET_TOKEN_TTL);
                return resetToken;
        }

        @Override
        public void resetPassword(ResetPasswordRequest request) {
                String email = normalizeEmail(request.email());
                String tokenKey = resetTokenKey(request.resetToken());
                String tokenEmail = redisTemplate.opsForValue().get(tokenKey);

                if (tokenEmail == null || !tokenEmail.equals(email)) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset token không hợp lệ hoặc đã hết hạn");
                }

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                                "Yêu cầu đặt lại mật khẩu không hợp lệ"));

                user.setPassword(passwordEncoder.encode(request.newPassword()));
                userRepository.save(user);
                redisTemplate.delete(tokenKey);
        }

        private Collection<? extends GrantedAuthority> getAuthorities(Role role) {
                return List.of(new SimpleGrantedAuthority("ROLE_" + role.getName()));
        }

        private String normalizeGender(String gender) {
                if (gender == null || gender.isBlank()) {
                        return "OTHER";
                }
                String normalized = gender.trim().toUpperCase();
                return ALLOWED_GENDERS.contains(normalized) ? normalized : "OTHER";
        }

        private String normalizeEmail(String email) {
                return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        }

        private String resetTokenKey(String resetToken) {
                return RESET_TOKEN_KEY_PREFIX + resetToken;
        }
}
