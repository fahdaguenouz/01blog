// src/main/java/blog/service/UserService.java
package blog.service;

import blog.dto.RegisterRequest;
import blog.dto.LoginRequest;
import blog.dto.AuthResponse;
import blog.models.User;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class UserService {
  private final UserRepository users;
  private final JwtService jwtService;

  public User register(RegisterRequest request) {
    if (users.existsByUsername(request.getUsername())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
    }
    if (users.existsByEmail(request.getEmail())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
    }
    User user = User.builder()
        .username(request.getUsername())
        .name(request.getUsername())
        .email(request.getEmail())
        .password(request.getPassword()) // hash later
        .status("active")
        .role("ROLE_USER")
        .createdAt(OffsetDateTime.now())
        .build();
    return users.save(user);
  }

  public AuthResponse authenticate(LoginRequest request) {
    // For now we allow username login only; extend to email if needed
    User user = users.findByUsername(request.getUsername())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    // Plain-text compare for testing only. Replace with BCrypt hashing later.
    if (!user.getPassword().equals(request.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole());
    return new AuthResponse(token, user);
  }
}
