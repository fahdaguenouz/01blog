package blog.controller;

import blog.dto.StatsDto;
import blog.models.User;
import blog.repository.UserRepository;
import blog.service.AdminStatsService;
import blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController  // Spring Web
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
  private final UserRepository userRepo;
  private final UserService userService;
    private final AdminStatsService service;

  @GetMapping("/users")
  public List<User> getAllUsers(Authentication auth) {
    // Double-check admin role server-side (never trust client)
    // Fix: Check for "ROLE_ADMIN" (Spring Security prefix)
    if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
    return userRepo.findAll();
  }

  @GetMapping("/users/{id}")
  public User getUser(@PathVariable UUID id, Authentication auth) {
    if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
    return userRepo.findById(id).orElseThrow(() -> 
        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Void> deleteUser(@PathVariable UUID id, Authentication auth) {
    if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
    }
    userRepo.deleteById(id);
    return ResponseEntity.noContent().build();
  }

   @GetMapping("/stats")
  public ResponseEntity<StatsDto> getStats() {
    StatsDto dto = service.getStats();
    return ResponseEntity.ok(dto);
  }
}
