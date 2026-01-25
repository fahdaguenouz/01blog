package blog.service.users;

import blog.models.Media;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
import blog.service.LocalMediaStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserRegistrationService {

  private final UserRepository users;
  private final LocalMediaStorage storage;
  private final MediaRepository mediaRepo;
  private final PasswordEncoder passwordEncoder;

  private static final Pattern EMAIL_PATTERN = Pattern.compile(
      "^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$",
      Pattern.CASE_INSENSITIVE
  );

  private String norm(String v) {
    return (v == null) ? null : v.trim().toLowerCase();
  }

  private boolean isValidEmail(String email) {
    return email != null && EMAIL_PATTERN.matcher(email).matches();
  }

  public void registerMultipart(String name, String username, String email, String password,
                                Integer age, String bio, MultipartFile avatar) {

    name = norm(name);
    username = norm(username);
    email = norm(email);
    bio = (bio == null) ? null : norm(bio);

    if (name == null || name.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
    if (username == null || username.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
    if (username.length() < 4)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must be at least 4 characters");
    if (email == null || email.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
    if (!isValidEmail(email))
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid email address");
    if (password == null || password.isBlank())
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
    if (age == null || age < 15)
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must be at least 15 years old");

    if (users.existsByUsername(username))
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
    if (users.existsByEmailIgnoreCase(email))
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
        .createdAt(OffsetDateTime.now().toInstant())
        .build();

    user = users.save(user);

    if (avatar != null && !avatar.isEmpty()) {
      var saved = storage.save(avatar);

      Media m = Media.builder()
          .userId(user.getId())
          .mediaType(saved.contentType() != null ? saved.contentType() : "image/*")
          .size(saved.size() != null ? saved.size() : 0)
          .url(saved.url())
          .uploadedAt(OffsetDateTime.now().toInstant())
          .build();

      m = mediaRepo.save(m);
      user.setAvatarMediaId(m.getId());
      users.save(user);
    }

   
  }
}
