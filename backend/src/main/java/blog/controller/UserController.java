// src/main/java/blog/controller/UserController.java
package blog.controller;

import blog.models.User;
import blog.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserRepository repo;
  public UserController(UserRepository repo) { this.repo = repo; }

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
    // Let DB generate UUID via default; ensure your entity doesn’t force non-null id on persist
    u.setId(null);
    return repo.save(u);
  }
}
