package com.example.StyleStore.service;

import com.example.StyleStore.dto.request.LoginRequest;
import com.example.StyleStore.dto.request.RegisterRequest;
import com.example.StyleStore.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}