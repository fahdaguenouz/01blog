package blog.controller;

import blog.dto.UserProfileDto;
import blog.models.Media;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
  private final UserRepository repo;
  private final MediaRepository mediaRepo;

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
}
