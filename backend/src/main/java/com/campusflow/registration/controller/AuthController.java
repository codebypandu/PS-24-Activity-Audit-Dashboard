package com.campusflow.registration.controller;

import com.campusflow.registration.dto.ApiMessage;
import com.campusflow.registration.dto.AuthRequest;
import com.campusflow.registration.dto.AuthResponse;
import com.campusflow.registration.dto.RegisterRequest;
import com.campusflow.registration.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiMessage register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return new ApiMessage("User registered successfully");
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return authService.login(request);
    }
}

