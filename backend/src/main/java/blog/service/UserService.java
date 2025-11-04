// src/main/java/blog/service/UserService.java
package blog.service;

import blog.dto.RegisterRequest;
import blog.models.User;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class UserService {
  private final UserRepository users;

  public User register(RegisterRequest request) {
    User user = User.builder()
        .username(request.getUsername())
        .name(request.getUsername())
        .email(request.getEmail())
        .password(request.getPassword()) // hash later
        .status("active")
        .role("ROLE_USER")
        .createdAt(OffsetDateTime.now())
        .build();
    return users.save(user);
  }
}
