// src/main/java/blog/controller/AuthController.java
package blog.controller;

import blog.models.User;
import blog.dto.RegisterRequest; // ensure this package matches your code
import blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final UserService userService;

  @PostMapping("/register")
  public User register(@RequestBody RegisterRequest request) {
    return userService.register(request);
  }
}
