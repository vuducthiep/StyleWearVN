package com.example.StyleStore.controller;

import com.example.StyleStore.dto.request.auth.ForgotPasswordRequest;
import com.example.StyleStore.dto.request.auth.LoginRequest;
import com.example.StyleStore.dto.request.auth.ResetPasswordRequest;
import com.example.StyleStore.dto.request.auth.RegisterRequest;
import com.example.StyleStore.dto.request.auth.SendOtpRequest;
import com.example.StyleStore.dto.request.auth.VerifyOtpRequest;
import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.dto.response.AuthResponse;
import com.example.StyleStore.service.AuthService;
import com.example.StyleStore.service.OtpService;
import com.example.StyleStore.service.OAuth2UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/auth", "/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OAuth2UserService oAuth2UserService;
    private final OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Object>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        otpService.sendOtpForRegistration(request.email());
        return ResponseEntity.ok(ApiResponse.ok("OTP đã được gửi tới email của bạn", null));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/oauth2/login")
    public ResponseEntity<AuthResponse> oAuth2Login(
            @RequestParam String email,
            @RequestParam String fullName,
            @RequestParam(required = false) String picture) {
        return ResponseEntity.ok(oAuth2UserService.processOAuth2User(email, fullName, picture));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("If the email exists, OTP has been sent", null));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Object>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String resetToken = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.ok("Xác thực OTP thành công", Map.of("resetToken", resetToken)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successful", null));
    }
}