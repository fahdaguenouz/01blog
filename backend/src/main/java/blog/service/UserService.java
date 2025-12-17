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

import java.time.OffsetDateTime;
import java.util.Map; 
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
  private final UserRepository users;
  private final JwtService jwtService;
  private final SessionRepository sessions;
  private final LocalMediaStorage storage;
  private final MediaRepository mediaRepo;

  public Optional<User> findByUsername(String username) {
    return users.findByUsername(username);
  }

  public User registerMultipart(String name, String username, String email, String password, Integer age, String bio,
      MultipartFile avatar) {
    // Validate required fields
    if (name == null || name.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
    if (username == null || username.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
    if (email == null || email.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
    if (password == null || password.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
    if (age == null || age < 0)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide a valid age");
    if (age < 15)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must be at least 15 years old");

    if (users.existsByUsername(username))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
    if (users.existsByEmail(email))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");

    User user = User.builder()
        .name(name)
        .username(username)
        .email(email)
        .password(password)
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

  public AuthResponse authenticate(LoginRequest request) {
    User user = users.findByUsername(request.getUsername())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!user.getPassword().equals(request.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    String token = jwtService.generateToken(user.getId(), user.getUsername(), user.getRole().name());
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
    return new AuthResponse(token, user, user.getRole().name());
  }

  public void logout(String token) {
    if (token == null || token.isEmpty())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token required");
    if (token.startsWith("Bearer "))
      token = token.substring(7);
    try {
      var claims = Jwts.parserBuilder().setSigningKey(jwtService.getSecretKey()).build().parseClaimsJws(token);
      String userId = (String) claims.getBody().get("uid");
      UUID uid = UUID.fromString(userId);
      sessions.findByUserId(uid).ifPresent(sessions::delete);
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
    // principal name is username in your auth flow
    String username = auth.getName();
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.UNAUTHORIZED, "User not found for authentication"));
  }

  public void assertAdmin(Authentication auth) {
  User user = getCurrentUser(auth);

  if (user.getRole() != User.Role.ADMIN) {
    throw new AccessDeniedException("Admin access required");
  }
}


}
