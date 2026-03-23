package com.example.StyleStore.controller;

import com.example.StyleStore.dto.LoginRequest;
import com.example.StyleStore.dto.ApiResponse;
import com.example.StyleStore.dto.AuthResponse;
import com.example.StyleStore.dto.SendOtpRequest;
import com.example.StyleStore.service.AuthService;
import com.example.StyleStore.service.OtpService;
import com.example.StyleStore.service.OAuth2UserService;
import com.example.StyleStore.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
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
}