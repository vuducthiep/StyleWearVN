package com.example.StyleStore.controller.user;

import com.example.StyleStore.dto.request.UserUpdateProfileRequest;
import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.dto.response.UserProfileResponse;
import com.example.StyleStore.model.User;
import com.example.StyleStore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/profile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class User_ProfileController {

    private final UserRepository userRepository;

    // Lấy user ID từ token JWT
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("Không tìm thấy thông tin đăng nhập");
        }

        // Ưu tiên lấy userId được set trong Authentication details
        Object details = authentication.getDetails();
        if (details instanceof Long) {
            return (Long) details;
        }

        // Fallback: lấy email và truy DB để lấy userId
        String email = authentication.getName();
        if (authentication.getPrincipal() instanceof UserDetails) {
            email = ((UserDetails) authentication.getPrincipal()).getUsername();
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tìm thấy"))
                .getId();
    }

    // Lấy thông tin cá nhân
    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        try {
            Long userId = getCurrentUserId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));

            UserProfileResponse profile = UserProfileResponse.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .gender(user.getGender())
                    .address(user.getAddress())
                    .role(user.getRole().getName())
                    .status(user.getStatus().name())
                    .createdAt(user.getCreatedAt())
                    .build();

            return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin thành công", profile));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.fail("Lỗi: " + e.getMessage()));
        }
    }

    // Cập nhật thông tin cá nhân
    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestBody UserUpdateProfileRequest request) {
        try {
            Long userId = getCurrentUserId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại"));

            // Cập nhật các thông tin được phép thay đổi
            if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
                user.setFullName(request.getFullName());
            }
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                user.setPhoneNumber(request.getPhoneNumber());
            }
            if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
                user.setGender(request.getGender());
            }
            if (request.getAddress() != null) {
                user.setAddress(request.getAddress());
            }

            user = userRepository.save(user);

            UserProfileResponse profile = UserProfileResponse.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhoneNumber())
                    .gender(user.getGender())
                    .address(user.getAddress())
                    .role(user.getRole().getName())
                    .status(user.getStatus().name())
                    .createdAt(user.getCreatedAt())
                    .build();

            return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công", profile));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.fail("Lỗi: " + e.getMessage()));
        }
    }
}
