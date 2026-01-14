package blog.controller;

import blog.dto.UserProfileDto;
import blog.enums.NotificationType;
import blog.models.Media;
import blog.models.Subscription;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.SubscriptionRepository;
import blog.repository.UserRepository;
import blog.service.NotificationService;
import blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserRepository users;
  private final MediaRepository mediaRepo;
  private final UserService userService;
  private final SubscriptionRepository subscriptions;
  private final NotificationService notificationService;

  // =========================
  // PUBLIC
  // =========================

  @GetMapping("/by-username/{username}")
  public UserProfileDto getByUsername(@PathVariable String username, Authentication auth) {
    User target = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    User me = null;
    boolean isSubscribed = false;

    if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
      me = users.findByUsername(auth.getName()).orElse(null);
      if (me != null) {
        isSubscribed = subscriptions.existsBySubscriberIdAndSubscribedToId(me.getId(), target.getId());
      }
    }

    return toProfileDto(target, isSubscribed);
  }

  @GetMapping("/search")
  public List<UserProfileDto> search(@RequestParam String q, Authentication auth) {
    User me = null;
    if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
      me = users.findByUsername(auth.getName()).orElse(null);
    }

    final User meFinal = me;

    return users.findByNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(q, q)
        .stream()
        .map(u -> {
          boolean isSubscribed = (meFinal != null) &&
              subscriptions.existsBySubscriberIdAndSubscribedToId(meFinal.getId(), u.getId());
          return toProfileDto(u, isSubscribed);
        })
        .toList();
  }

  // =========================
  // ME (AUTH REQUIRED)
  // =========================

  @GetMapping("/me")
  public Map<String, Object> getMe(Authentication auth) {
    User me = userService.getCurrentUser(auth);

    String avatarUrl = null;
    if (me.getAvatarMediaId() != null) {
      avatarUrl = mediaRepo.findById(me.getAvatarMediaId()).map(Media::getUrl).orElse(null);
    }

    Map<String, Object> response = new HashMap<>();
    response.put("id", me.getId());
    response.put("username", me.getUsername());
    response.put("name", me.getName());
    response.put("email", me.getEmail());
    response.put("bio", me.getBio());
    response.put("age", me.getAge());
    response.put("avatarUrl", avatarUrl);
    response.put("role", me.getRole().name());
    return response;
  }

  @PutMapping("/me")
  public UserProfileDto updateProfile(@RequestBody Map<String, Object> updates, Authentication auth) {
    User me = userService.getCurrentUser(auth);
    return userService.updateProfileByUsername(me.getUsername(), updates);
  }

  @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Void> uploadAvatar(@RequestPart("avatar") MultipartFile avatar, Authentication auth) {
    User me = userService.getCurrentUser(auth);
    userService.updateAvatar(me.getUsername(), avatar);
    return ResponseEntity.ok().build();
  }

  // =========================
  // SUBSCRIBE / UNSUBSCRIBE (AUTH REQUIRED)
  // =========================

  @PostMapping("/{userId}/subscribe")
  @Transactional
  public ResponseEntity<UserProfileDto> subscribe(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);

    if (me.getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot follow yourself");
    }

    if (subscriptions.existsBySubscriberIdAndSubscribedToId(me.getId(), userId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Already following this user");
    }

    // ensure target exists
    User target = users.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found"));

    Subscription s = Subscription.builder()
        .subscriberId(me.getId())
        .subscribedToId(userId)
        .createdAt(OffsetDateTime.now())
        .build();

    subscriptions.saveAndFlush(s);

    // ✅ notification
    notificationService.notify(target, me, NotificationType.USER_FOLLOWED, null);

    // return target profile with isSubscribed=true
    return ResponseEntity.ok(toProfileDto(target, true));
  }

  @DeleteMapping("/{userId}/subscribe")
  @Transactional
  public ResponseEntity<UserProfileDto> unsubscribe(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);

    // ensure target exists
    User target = users.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user not found"));

    subscriptions.deleteBySubscriberIdAndSubscribedToId(me.getId(), userId);
    subscriptions.flush();

    // ✅ return target profile with isSubscribed=false (FIXED)
    return ResponseEntity.ok(toProfileDto(target, false));
  }

  // =========================
  // FOLLOWERS / FOLLOWING
  // =========================

  @GetMapping("/{userId}/followers")
  public List<UserProfileDto> getFollowers(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);

    List<UUID> followerIds = subscriptions.findSubscriberIdsBySubscribedToId(userId);
    if (followerIds.isEmpty()) return List.of();

    List<User> followerUsers = users.findAllById(followerIds);

    // isSubscribed = does ME subscribe to each listed user?
    return followerUsers.stream()
        .map(u -> toProfileDto(u,
            subscriptions.existsBySubscriberIdAndSubscribedToId(me.getId(), u.getId())))
        .toList();
  }

  @GetMapping("/{userId}/following")
  public List<UserProfileDto> getFollowing(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);

    List<UUID> followingIds = subscriptions.findSubscribedToIdsBySubscriberId(userId);
    if (followingIds.isEmpty()) return List.of();

    List<User> followingUsers = users.findAllById(followingIds);

    return followingUsers.stream()
        .map(u -> toProfileDto(u,
            subscriptions.existsBySubscriberIdAndSubscribedToId(me.getId(), u.getId())))
        .toList();
  }

  // =========================
  // DTO builder (single source of truth)
  // =========================

  private UserProfileDto toProfileDto(User user, boolean isSubscribed) {
    String avatarUrl = null;
    if (user.getAvatarMediaId() != null) {
      avatarUrl = mediaRepo.findById(user.getAvatarMediaId()).map(Media::getUrl).orElse(null);
    }

    int followers = (int) subscriptions.countBySubscribedToId(user.getId());
    int following = (int) subscriptions.countBySubscriberId(user.getId());

    return new UserProfileDto(
        user.getId(),
        user.getUsername(),
        user.getName(),
        user.getEmail(),
        user.getBio(),
        user.getAge(),
        avatarUrl,
        followers,
        following,
        isSubscribed
    );
  }
}
