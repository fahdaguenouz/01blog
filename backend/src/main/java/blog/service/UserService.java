package blog.service;

import blog.dto.AuthResponse;
import blog.dto.LoginRequest;
import blog.dto.UserProfileDto;
import blog.models.Media;
import blog.models.Session;
import blog.models.User;

import blog.repository.MediaRepository;
import blog.repository.SessionRepository;
import blog.repository.UserRepository;
import blog.security.JwtService;
import io.jsonwebtoken.Jwts;
import jakarta.transaction.Transactional;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import lombok.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Builder
@Service
@RequiredArgsConstructor
public class UserService {
  private final UserRepository users;
  private final JwtService jwtService;
  private final SessionRepository sessions;
  private final LocalMediaStorage storage;
  private final MediaRepository mediaRepo;
  private final PasswordEncoder passwordEncoder;

  public Optional<User> findByUsername(String username) {
    return users.findByUsername(username);
  }

  private String norm(String v) {
    return (v == null) ? null : v.trim().toLowerCase();
  }

  public User registerMultipart(String name, String username, String email, String password, Integer age, String bio,
      MultipartFile avatar) {
    name = norm(name);
    username = norm(username);
    email = norm(email);
    bio = (bio == null) ? null : norm(bio);

    if (name == null || name.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");

    if (username == null || username.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");

    // ✅ more than 3 chars => at least 4
    if (username.length() < 4)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must be at least 4 characters");

    if (email == null || email.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
    if (password == null || password.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
    if (age == null || age < 0)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide a valid age");
    if (age < 15)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must be at least 15 years old");

    // ✅ now these checks become reliable
    if (users.existsByUsername(username))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
    if (users.existsByEmail(email))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");

    User user = User.builder()
        .name(name)
        .username(username)
        .email(email)
        .password(passwordEncoder.encode(password))

        .bio(bio)
        .age(age)
        .status("active")
        .role(User.Role.USER)
        .impressionsCount(0)
        .postsCount(0)
        .createdAt(OffsetDateTime.now())
        .build();

    // Save user first to get id
    user = users.save(user);

    // Optional avatar
    if (avatar != null && !avatar.isEmpty()) {
      var saved = storage.save(avatar); // url, size, contentType
      Media m = Media.builder()
          .userId(user.getId())
          .mediaType(saved.contentType() != null ? saved.contentType() : "image/*")
          .size(saved.size() != null ? saved.size() : 0)
          .url(saved.url()) // recommend relative: /uploads/xxxx
          .uploadedAt(OffsetDateTime.now())
          .build();
      m = mediaRepo.save(m);
      user.setAvatarMediaId(m.getId());
      user = users.save(user);
    }

    return user;
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

    if (user.getStatus() != null && user.getStatus().equalsIgnoreCase("banned")) {
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

  public void logout(String tokenHeader) {
    if (tokenHeader == null || tokenHeader.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token required");
    }

    String token = tokenHeader;
    if (token.startsWith("Bearer "))
      token = token.substring(7);

    try {
      UUID uid = jwtService.extractUserId(token);
      sessions.deleteByUserId(uid); // delete session (invalidate token)
    } catch (JwtException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user ID in token");
    }
  }

  @Transactional
  public UserProfileDto updateProfileByUsername(String username, Map<String, Object> updates) {
    User user = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (updates.containsKey("name")) {
      user.setName((String) updates.get("name"));
    }
    if (updates.containsKey("email")) {
      user.setEmail((String) updates.get("email"));
    }
    if (updates.containsKey("bio")) {
      user.setBio((String) updates.get("bio"));
    }
    if (updates.containsKey("age")) {
      Integer age = (Integer) updates.get("age");
      if (age != null && age >= 15)
        user.setAge(age);
    }

    // Save updated user
    user = users.save(user);

    String avatarUrl = null;
    // if (user.getAvatarMediaId() != null) {
    // Media media = mediaRepo.findById(user.getAvatarMediaId()).orElse(null);
    // if (media != null) {
    // avatarUrl = media.getUrl();
    // }
    // }

    return new UserProfileDto(
        user.getId(), user.getUsername(), user.getName(), user.getEmail(),
        user.getBio(), user.getAge(), avatarUrl);
  }

  @Transactional
  public void updateAvatar(String username, MultipartFile avatar) {
    User user = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    var saved = storage.save(avatar);

    Media media = Media.builder()
        .userId(user.getId())
        .mediaType(saved.contentType() != null ? saved.contentType() : "image/*")
        .size(saved.size() != null ? saved.size() : 0)
        .url(saved.url())
        .uploadedAt(OffsetDateTime.now())
        .build();
    media = mediaRepo.save(media);

    user.setAvatarMediaId(media.getId());
    users.save(user);
  }

  public User getCurrentUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    return users.findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  public void assertAdmin(Authentication auth) {
    User user = getCurrentUser(auth);

    if (user.getRole() != User.Role.ADMIN) {
      throw new AccessDeniedException("Admin access required");
    }
  }

}
