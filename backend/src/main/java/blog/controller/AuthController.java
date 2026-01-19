package blog.controller;

import blog.dto.AuthResponse;
import blog.dto.LoginRequest;
import blog.models.User;
import blog.service.users.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final UserService userService;

  // Multipart to allow optional avatar at signup
  @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public User register(
      @RequestParam String name,
      @RequestParam String username,
      @RequestParam String email,
      @RequestParam String password,
      @RequestParam Integer age,
      @RequestParam(required = false) String bio,
      @RequestPart(required = false) MultipartFile avatar
  ) {
    return userService.registerMultipart(name, username, email, password, age, bio, avatar);
  }

  @PostMapping("/login")
  public AuthResponse login(@RequestBody LoginRequest request) {
    
  AuthResponse response = userService.authenticate(request);
  
    return response;
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String token) {
    userService.logout(token);
    return ResponseEntity.ok().build();
  }
}
