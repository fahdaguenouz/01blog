// src/main/java/blog/controller/PostController.java
package blog.controller;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.service.PostService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

  private final PostService postService;

  public PostController(PostService postService) {
    this.postService = postService;
  }

  // ✅ Protected feed endpoint — visible only to authenticated users
  @GetMapping("/feed")
  public List<PostSummaryDto> getFeed() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new RuntimeException("Unauthorized");
    }
    String username = auth.getName(); // Get username from principal
    return postService.getFeedForUser(username);
  }

  @PostMapping
  public PostDetailDto create(
      @RequestParam String title,
      @RequestParam String description,
      @RequestParam(required = false) org.springframework.web.multipart.MultipartFile media) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new RuntimeException("Unauthorized");
    }
    return postService.createPost(auth.getName(), title, description, media);
  }

  @PostMapping("/{postId}/like")
  public void likePost(@PathVariable UUID postId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new RuntimeException("Unauthorized");
    }
    postService.likePost(auth.getName(), postId);
  }

  @DeleteMapping("/{postId}/like")
  public void unlikePost(@PathVariable UUID postId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new RuntimeException("Unauthorized");
    }
    postService.unlikePost(auth.getName(), postId);
  }

  @GetMapping("/{id}")
  public PostDetailDto getOne(@PathVariable UUID id) {
    return postService.getOne(id);
  }
}
