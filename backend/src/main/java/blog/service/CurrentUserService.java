package blog.service;

import blog.models.User;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

  private final UserRepository users;

  public User getCurrentUser(Authentication auth) {
    if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    return users.findByUsername(auth.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  public User getCurrentUserOrNull(Authentication auth) {
    if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
      return null;
    }
    return users.findByUsername(auth.getName()).orElse(null);
  }

  public void assertAdmin(Authentication auth) {
    User user = getCurrentUser(auth);
    if (user.getRole() != User.Role.ADMIN) {
      throw new AccessDeniedException("Admin access required");
    }
  }
}
