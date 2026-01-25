package blog.controller;

import blog.dto.UserProfileDto;
import blog.enums.NotificationType;
import blog.mapper.UserProfileMapper;
import blog.models.Media;
import blog.models.Subscription;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.SubscriptionRepository;
import blog.repository.UserRepository;
import blog.service.NotificationService;
import blog.service.SubscriptionService;
import blog.service.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final SubscriptionService subscriptionService;

  @GetMapping("/username/{username}")
  public UserProfileDto getByUsername(@PathVariable String username, Authentication auth) {
    return userService.getProfileByUsername(username, auth);
  }

  @GetMapping("/search")
  public List<UserProfileDto> search(@RequestParam String q, Authentication auth) {
    return userService.searchProfiles(q, auth);
  }

  @GetMapping("/me")
  public Map<String, Object> getMe(Authentication auth) {
    return userService.getMe(auth); 
  }

  @PutMapping("/me")
  public UserProfileDto updateProfile(@RequestBody Map<String, Object> updates, Authentication auth) {
    return userService.updateMyProfile(updates, auth);
  }

  @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Void> uploadAvatar(@RequestPart("avatar") MultipartFile avatar, Authentication auth) {
    userService.updateMyAvatar(avatar, auth);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/{userId}/subscribe")
  public ResponseEntity<UserProfileDto> subscribe(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);
    return ResponseEntity.ok(subscriptionService.subscribe(userId, me));
  }

  @DeleteMapping("/{userId}/subscribe")
  public ResponseEntity<UserProfileDto> unsubscribe(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);
    return ResponseEntity.ok(subscriptionService.unsubscribe(userId, me));
  }

  @GetMapping("/{userId}/followers")
  public List<UserProfileDto> getFollowers(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);
    return subscriptionService.followers(userId, me.getId());
  }

  @GetMapping("/{userId}/following")
  public List<UserProfileDto> getFollowing(@PathVariable UUID userId, Authentication auth) {
    User me = userService.getCurrentUser(auth);
    return subscriptionService.following(userId, me.getId());
  }
}
