package com.example.StyleStore.service;

import com.example.StyleStore.dto.request.auth.ForgotPasswordRequest;
import com.example.StyleStore.dto.request.auth.LoginRequest;
import com.example.StyleStore.dto.request.auth.ResetPasswordRequest;
import com.example.StyleStore.dto.request.auth.RegisterRequest;
import com.example.StyleStore.dto.request.auth.VerifyOtpRequest;
import com.example.StyleStore.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    String verifyOtp(VerifyOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
}