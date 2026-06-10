package com.campusflow.registration.controller;

import com.campusflow.registration.dto.ApiMessage;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiMessage> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
        return ResponseEntity.badRequest().body(new ApiMessage(message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiMessage> handleStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(new ApiMessage(ex.getReason()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiMessage> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ApiMessage("Invalid email or password"));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiMessage> handleIntegrity(DataIntegrityViolationException ex) {
        return ResponseEntity.badRequest().body(new ApiMessage("Email already registered"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiMessage> handleOther(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ApiMessage("Unexpected server error"));
    }
}
