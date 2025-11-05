// src/main/java/blog/service/UserService.java
package blog.service;

import blog.dto.RegisterRequest;
import blog.dto.LoginRequest;
import blog.dto.AuthResponse;
import blog.models.User;
import blog.repository.UserRepository;
import blog.repository.SessionRepository;
import blog.models.Session;
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
  private final SessionRepository sessions;

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

    // Upsert single session per user
    var existing = sessions.findByUserId(user.getId());
    OffsetDateTime now = OffsetDateTime.now();
    OffsetDateTime exp = now.plusDays(1);
    if (existing.isPresent()) {
      Session s = existing.get();
      s.setToken(token);
      s.setCreatedAt(now);
      s.setExpiresAt(exp);
      sessions.save(s);
    } else {
      Session s = Session.builder()
          .userId(user.getId())
          .token(token)
          .createdAt(now)
          .expiresAt(exp)
          .build();
      sessions.save(s);
    }

    return new AuthResponse(token, user);
  }
   public void logout(String token) {
    if (token == null || token.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token required");
    }

    // Remove "Bearer " prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.substring(7);
    }

    try {
      // Extract user ID from token (optional validation)
      var claims = Jwts.parserBuilder()
          .setSigningKey(jwtService.getSecretKey())
          .build()
          .parseClaimsJws(token);
      
      String userId = (String) claims.getBody().get("uid");
      UUID userUUID = UUID.fromString(userId);
      
      // Delete session from database
      sessions.findByUserId(userUUID).ifPresent(sessions::delete);
    } catch (JwtException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
    }
  }
}
