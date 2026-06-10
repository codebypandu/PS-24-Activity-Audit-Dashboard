package com.campusflow.registration.service;

import com.campusflow.registration.dto.AuthRequest;
import com.campusflow.registration.dto.AuthResponse;
import com.campusflow.registration.dto.RegisterRequest;
import com.campusflow.registration.model.Role;
import com.campusflow.registration.model.User;
import com.campusflow.registration.repository.UserRepository;
import com.campusflow.registration.security.JwtService;
import java.util.Map;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public void register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedName = request.getFullName().trim().replaceAll("\\s+", " ");

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already registered");
        }

        User user = new User();
        user.setFullName(normalizedName);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ANALYST);
        userRepository.save(user);
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid credentials"));

        String token = jwtService.generateToken(
            user.getEmail(),
            Map.of("role", user.getRole().name(), "fullName", user.getFullName())
        );

        return new AuthResponse(token, user.getRole().name(), user.getFullName(), user.getEmail());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
