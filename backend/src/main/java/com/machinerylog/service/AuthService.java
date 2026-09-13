package com.machinerylog.service;

import com.machinerylog.dto.AuthRequest;
import com.machinerylog.dto.AuthResponse;
import com.machinerylog.dto.RefreshRequest;
import com.machinerylog.entity.User;
import com.machinerylog.repository.UserRepository;
import com.machinerylog.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, UserRepository users, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.jwtService = jwtService;
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        User user = users.findByUsername(request.username()).orElseThrow();
        return response(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        if (!jwtService.isRefreshToken(request.refreshToken())) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        User user = users.findByUsername(jwtService.extractUsername(request.refreshToken())).orElseThrow();
        return response(user);
    }

    private AuthResponse response(User user) {
        return new AuthResponse(jwtService.createAccessToken(user), jwtService.createRefreshToken(user), "Bearer", jwtService.getAccessTokenSeconds());
    }
}
