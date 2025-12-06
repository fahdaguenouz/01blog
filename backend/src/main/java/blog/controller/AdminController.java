package blog.controller;

import blog.dto.DailyStatsDto;
import blog.dto.ReportCategoryCountDto;
import blog.dto.StatsDto;
import blog.dto.TopContributorDto;
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

@RestController // Spring Web
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
    return userRepo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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

 @GetMapping("/stats/trends")
public ResponseEntity<List<DailyStatsDto>> getTrends(@RequestParam(defaultValue = "30d") String period) {
    List<DailyStatsDto> list = service.getDailyStats(period);
    return ResponseEntity.ok(list);
}

@GetMapping("/stats/report-categories")
public ResponseEntity<List<ReportCategoryCountDto>> getReportCategoryStats() {
  List<ReportCategoryCountDto> list = service.getReportCategoryStats();
  return ResponseEntity.ok(list);
}


@GetMapping("/stats/top-contributors")
public ResponseEntity<List<TopContributorDto>> getTopContributors(
    @RequestParam(defaultValue = "10") int limit
) {
  List<TopContributorDto> list = service.getTopContributors(limit);
  return ResponseEntity.ok(list);
}



@PatchMapping("/users/{id}/status")
public ResponseEntity<User> updateUserStatus(
    @PathVariable UUID id,
    @RequestBody StatusBody body,
    Authentication auth
) {
  if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
  }

  User user = userRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

  user.setStatus(body.status()); // e.g. "active" / "banned"
  return ResponseEntity.ok(userRepo.save(user));
}

public record StatusBody(String status) {}





@PatchMapping("/users/{id}/role")
public ResponseEntity<User> updateUserRole(
    @PathVariable UUID id,
    @RequestBody RoleBody body,
    Authentication auth
) {
  if (!auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
  }

  User user = userRepo.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

  // expect "USER" or "ADMIN"
  try {
    user.setRole(User.Role.valueOf(body.role()));
  } catch (IllegalArgumentException ex) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
  }

  return ResponseEntity.ok(userRepo.save(user));
}

public record RoleBody(String role) {}



}
