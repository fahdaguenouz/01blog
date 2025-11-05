// src/main/java/blog/controller/AuthController.java
package blog.controller;

import blog.models.User;
import blog.dto.RegisterRequest; // ensure this package matches your code
import blog.dto.LoginRequest;
import blog.dto.AuthResponse;
import blog.service.UserService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final UserService userService;

  @PostMapping("/register")
  public User register(@RequestBody RegisterRequest request) {
    return userService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody LoginRequest request) {
    return userService.authenticate(request);
  }
   @PostMapping("/logout")
  public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
    userService.logout(token);
    return ResponseEntity.ok().build();
  }
}
