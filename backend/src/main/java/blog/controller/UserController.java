package blog.controller;

import blog.dto.UserProfileDto;
import blog.models.Media;
import blog.models.Subscription;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.SubscriptionRepository;
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

import java.time.OffsetDateTime;
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
 private final SubscriptionRepository subscriptionRepo;
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
public UserProfileDto getByUsername(@PathVariable String username, Authentication auth) {
    User user = repo.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    
    String avatarUrl = null;
    if (user.getAvatarMediaId() != null) {
        Media media = mediaRepo.findById(user.getAvatarMediaId()).orElse(null);
        if (media != null) {
            avatarUrl = media.getUrl();
        }
    }
    
    // Cast long to int explicitly
    int subscribersCount = (int) subscriptionRepo.countBySubscribedToId(user.getId());
    int subscriptionsCount = (int) subscriptionRepo.countBySubscriberId(user.getId());
    
    boolean isSubscribed = false;
    if (auth != null && auth.isAuthenticated()) {
        String currentUsername = auth.getName();
        User currentUser = repo.findByUsername(currentUsername).orElse(null);
        if (currentUser != null) {
            isSubscribed = subscriptionRepo.existsBySubscriberIdAndSubscribedToId(
                currentUser.getId(), user.getId());
        }
    }
    
    return new UserProfileDto(
        user.getId(), user.getUsername(), user.getName(), user.getEmail(),
        user.getBio(), user.getAge(), avatarUrl,
        subscribersCount, subscriptionsCount, isSubscribed
    );
}


  @GetMapping("/me")
  public UserProfileDto getMe(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }

    String username = auth.getName();
    User user = repo.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
        avatarUrl);
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


  @PostMapping("/{userId}/subscribe")
public ResponseEntity<Void> subscribe(@PathVariable UUID userId, Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    
    String currentUsername = auth.getName();
    User currentUser = repo.findByUsername(currentUsername)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user not found"));
    
    // Prevent self-follow
    if (currentUser.getId().equals(userId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
    }
    
    // Check if already following
    if (subscriptionRepo.existsBySubscriberIdAndSubscribedToId(currentUser.getId(), userId)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already following this user");
    }
    
    Subscription subscription = Subscription.builder()
        .subscriberId(currentUser.getId())
        .subscribedToId(userId)
        .createdAt(OffsetDateTime.now())
        .build();
    
    subscriptionRepo.save(subscription);
    return ResponseEntity.ok().build();
}

@DeleteMapping("/{userId}/subscribe")
public ResponseEntity<Void> unsubscribe(@PathVariable UUID userId, Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    
    String currentUsername = auth.getName();
    User currentUser = repo.findByUsername(currentUsername)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user not found"));
    
    subscriptionRepo.deleteBySubscriberIdAndSubscribedToId(currentUser.getId(), userId);
    return ResponseEntity.ok().build();
}
}
