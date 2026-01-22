// src/main/java/blog/controller/admin/AdminUsersController.java
package blog.controller.admin;

import blog.models.User;
import blog.repository.UserRepository;
import blog.service.admin.AdminStatsService;
import blog.service.admin.AdminUserModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor

public class AdminUsersController {

  private final UserRepository userRepo;
  private final AdminStatsService adminStatsService;
  private final AdminUserModerationService adminUserModerationService;


  @GetMapping
  public List<User> getAllUsers(Authentication auth) {
    // exclude current admin from list
    String currentUsername = auth.getName();
    return userRepo.findAll().stream()
        .filter(u -> !u.getUsername().equals(currentUsername))
        .toList();
  }

  @GetMapping("/{id}")
  public User getUser(@PathVariable UUID id) {
    return userRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<User> updateUserStatus(
      @PathVariable UUID id,
      @RequestBody StatusBody body,
      Authentication auth
  ) {
    // cannot change own status
    String currentUsername = auth.getName();
    userRepo.findByUsername(currentUsername).ifPresent(current -> {
      if (current.getId().equals(id)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change your own status");
      }
    });

    if (body == null || body.status() == null || body.status().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing status");
    }

    String s = body.status().trim().toLowerCase();
    if (!s.equals("active") && !s.equals("banned")) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status (use: active | banned)");
    }

    User user = userRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    user.setStatus(s);
    return ResponseEntity.ok(userRepo.save(user));
  }

  public record StatusBody(String status) {}

  @PatchMapping("/{id}/role")
  public ResponseEntity<User> updateUserRole(
      @PathVariable UUID id,
      @RequestBody RoleBody body,
      Authentication auth
  ) {
    // cannot change own role
    String currentUsername = auth.getName();
    userRepo.findByUsername(currentUsername).ifPresent(current -> {
      if (current.getId().equals(id)) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot change your own role");
      }
    });

    if (body == null || body.role() == null || body.role().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing role");
    }

    User user = userRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    try {
      user.setRole(User.Role.valueOf(body.role().trim().toUpperCase()));
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
    }

    return ResponseEntity.ok(userRepo.save(user));
  }

  public record RoleBody(String role) {}

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteUser(@PathVariable UUID id, Authentication auth) {
    // cannot delete self
    String currentUsername = auth.getName();
    User current = userRepo.findByUsername(currentUsername)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.INTERNAL_SERVER_ERROR, "Current user not found"));

    if (current.getId().equals(id)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot delete your own account");
    }

    if (!userRepo.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
    }

    adminUserModerationService.deleteUserAndAllContent(id);

    return ResponseEntity.noContent().build();
  }
}
