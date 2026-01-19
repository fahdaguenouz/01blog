package blog.service;

import blog.dto.AuthResponse;
import blog.dto.LoginRequest;
import blog.models.Session;
import blog.models.User;
import blog.repository.SessionRepository;
import blog.repository.UserRepository;
import blog.security.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository users;
  private final JwtService jwtService;
  private final SessionRepository sessions;
  private final PasswordEncoder passwordEncoder;

  private String norm(String v) {
    return (v == null) ? null : v.trim().toLowerCase();
  }

  private String sha256(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  public AuthResponse authenticate(LoginRequest request) {
    if (request == null || request.getUsername() == null || request.getUsername().isBlank()
        || request.getPassword() == null || request.getPassword().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter username and password.");
    }

    String username = norm(request.getUsername());

    User user = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password."));

    if ("banned".equalsIgnoreCase(user.getStatus())) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Your account has been banned. Please contact support if you believe this is a mistake.");
    }

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password.");
    }

    var token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name());

    Instant now = Instant.now();
    Instant exp = token.exp().toInstant();

    Session s = sessions.findByUserId(user.getId())
        .orElseGet(() -> Session.builder().userId(user.getId()).build());

    s.setToken(sha256(token.jti()));
    s.setCreatedAt(now);
    s.setExpiresAt(exp);
    sessions.save(s);

    return new AuthResponse(token.token(), user, user.getRole().name());
  }

  @Transactional
  public void logout(String tokenHeader) {
    if (tokenHeader == null || tokenHeader.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token required");
    }

    String token = tokenHeader.startsWith("Bearer ") ? tokenHeader.substring(7) : tokenHeader;

    try {
      UUID uid = jwtService.extractUserId(token);
      sessions.deleteByUserId(uid);
    } catch (JwtException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user ID in token");
    }
  }
}
