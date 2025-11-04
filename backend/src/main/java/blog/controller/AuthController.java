package blog.controller;

import blog.dto.LoginRequest;
import blog.dto.RegisterRequest;
import blog.entity.User;
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
        return userService.registerUser(request);
    }

    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        // For now, just return a placeholder
        return "Login endpoint is ready (implement JWT later)";
    }
}
