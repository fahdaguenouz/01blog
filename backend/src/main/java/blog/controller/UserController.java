package blog.controller;

import blog.dto.UserProfileDto;
import blog.models.Media;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
import blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
  private final UserRepository repo;
  private final MediaRepository mediaRepo;
  private final UserService userService;

  @GetMapping
  public List<User> all() {
    return repo.findAll();
  }

  @GetMapping("/{id}")
  public User one(@PathVariable UUID id) {
    return repo.findById(id).orElseThrow();
  }

  @PostMapping
  public User create(@RequestBody User u) {
    u.setId(null);
    return repo.save(u);
  }

  @GetMapping("/by-username/{username}")
  public UserProfileDto getByUsername(@PathVariable String username) {
    User user = repo.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    // Resolve avatar URL if exists
    String avatarUrl = null;
    if (user.getAvatarMediaId() != null) {
      Media media = mediaRepo.findById(user.getAvatarMediaId()).orElse(null);
      if (media != null) {
        avatarUrl = media.getUrl();
      }
    }

    return new UserProfileDto(
      user.getId(),
      user.getUsername(),
      user.getName(),
      user.getEmail(),
      user.getBio(),
      user.getAge(),
      avatarUrl
    );
  }
  @PutMapping("/me")
  public UserProfileDto updateProfile(@RequestBody Map<String, Object> updates, Authentication auth) {
    String username = auth.getName();
    return userService.updateProfileByUsername(username, updates);
  }
   @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Void> uploadAvatar(@RequestPart("avatar") MultipartFile avatar, Authentication auth) {
    String username = auth.getName();
    userService.updateAvatar(username, avatar);
    return ResponseEntity.ok().build();
  }
}
