package com.example.StyleStore.dto.response;

import com.example.StyleStore.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String gender;
    private String address;
    private String status;
    private RoleSummary role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleSummary {
        private Long id;
        private String name;
    }

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .gender(user.getGender())
                .address(user.getAddress())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null
                        ? RoleSummary.builder()
                            .id(user.getRole().getId())
                            .name(user.getRole().getName())
                            .build()
                        : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
