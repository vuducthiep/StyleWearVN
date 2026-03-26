package com.example.StyleStore.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateProfileRequest {
    private String fullName;
    private String phoneNumber;
    private String gender;
    private String address;
}
