package com.machinerylog.controller;

import com.machinerylog.api.ApiError;
import com.machinerylog.dto.AuthRequest;
import com.machinerylog.dto.AuthResponse;
import com.machinerylog.dto.RefreshRequest;
import com.machinerylog.dto.UserDto;
import com.machinerylog.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/login")
    public ResponseEntity<ApiError> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(new ApiError(response, "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiError> refresh(@Valid @RequestBody RefreshRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(new ApiError(response, "Token refreshed"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiError> logout() {
        authService.logout();
        return ResponseEntity.ok(new ApiError(null, "Logout successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me() {
        UserDto user = authService.me();
        return ResponseEntity.ok(user);
    }
}
