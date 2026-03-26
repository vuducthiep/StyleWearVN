package com.example.StyleStore.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
                @NotBlank(message = "Họ tên không được để trống") @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự") String fullName,

                @NotBlank(message = "Email không được để trống") @Email(message = "Email không đúng định dạng") String email,

                @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự") String password,

                @NotBlank(message = "OTP không được để trống") @Pattern(regexp = "^\\d{6}$", message = "OTP phải gồm đúng 6 chữ số") String otp,

                String phoneNumber, // optional

                String gender, // "MALE", "FEMALE", "OTHER" - optional

                String address // optional
) {
}