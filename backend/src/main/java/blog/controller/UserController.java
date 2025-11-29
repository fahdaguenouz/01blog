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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;

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

    boolean isSubscribed = false;
    if (auth != null && auth.isAuthenticated()) {
        UUID currentUserId = repo.findByUsername(auth.getName())
                                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND))
                                 .getId();
        isSubscribed = subscriptionRepo.existsBySubscriberIdAndSubscribedToId(currentUserId, user.getId());
    }

    return new UserProfileDto(
        user.getId(), user.getUsername(), user.getName(), user.getEmail(),
        user.getBio(), user.getAge(), user.getAvatarMediaId() != null ? mediaRepo.findById(user.getAvatarMediaId()).map(Media::getUrl).orElse(null) : null,
        (int)subscriptionRepo.countBySubscribedToId(user.getId()),
        (int)subscriptionRepo.countBySubscriberId(user.getId()),
        isSubscribed
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
  @Transactional
public ResponseEntity<UserProfileDto> subscribe(@PathVariable UUID userId, Authentication auth) {
if (auth == null) {
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
}


if (!auth.isAuthenticated()) {
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
}

String currentUsername = auth.getName();

User currentUser = repo.findByUsername(currentUsername)
    .orElseThrow(() -> {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user not found");
    });



if (currentUser.getId().equals(userId)) {
  
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
}

boolean alreadySubscribed = subscriptionRepo.existsBySubscriberIdAndSubscribedToId(currentUser.getId(), userId);

if (alreadySubscribed) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already following this user");
}

Subscription subscription = Subscription.builder()
    .subscriberId(currentUser.getId())
    .subscribedToId(userId)
    .createdAt(OffsetDateTime.now())
    .build();


subscriptionRepo.save(subscription);
subscriptionRepo.flush();

User targetUser = repo.findById(userId).orElseThrow(() -> {
    return new ResponseStatusException(HttpStatus.NOT_FOUND);
});


boolean isSubscribed = subscriptionRepo.existsBySubscriberIdAndSubscribedToId(currentUser.getId(), userId);

String avatarUrl = null;
if (targetUser.getAvatarMediaId() != null) {
    avatarUrl = mediaRepo.findById(targetUser.getAvatarMediaId())
        .map(Media::getUrl)
        .orElse(null);
} else {
    System.out.println("[subscribe] Target user has no avatarMediaId");
}

int followersCount = (int) subscriptionRepo.countBySubscribedToId(targetUser.getId());
int followingCount = (int) subscriptionRepo.countBySubscriberId(targetUser.getId());

UserProfileDto dto = new UserProfileDto(
    targetUser.getId(), targetUser.getUsername(), targetUser.getName(), targetUser.getEmail(),
    targetUser.getBio(), targetUser.getAge(), avatarUrl,
    followersCount,
    followingCount,
    isSubscribed
);

return ResponseEntity.ok(dto);

}

@DeleteMapping("/{userId}/subscribe")
@Transactional
public ResponseEntity<UserProfileDto> unsubscribe(@PathVariable UUID userId, Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }

    String currentUsername = auth.getName();
    User currentUser = repo.findByUsername(currentUsername)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user not found"));

    subscriptionRepo.deleteBySubscriberIdAndSubscribedToId(currentUser.getId(), userId);
    subscriptionRepo.flush();

    // Return updated profile DTO for the target user
    User targetUser = repo.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    boolean isSubscribed = subscriptionRepo.existsBySubscriberIdAndSubscribedToId(currentUser.getId(), userId);
    String avatarUrl = targetUser.getAvatarMediaId() != null ? mediaRepo.findById(targetUser.getAvatarMediaId()).map(Media::getUrl).orElse(null) : null;

    UserProfileDto dto = new UserProfileDto(
        targetUser.getId(), targetUser.getUsername(), targetUser.getName(), targetUser.getEmail(),
        targetUser.getBio(), targetUser.getAge(), avatarUrl,
        (int) subscriptionRepo.countBySubscribedToId(targetUser.getId()),
        (int) subscriptionRepo.countBySubscriberId(targetUser.getId()),
        isSubscribed
    );

    return ResponseEntity.ok(dto);
}
}
