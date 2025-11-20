// src/main/java/blog/controller/PostController.java
package blog.controller;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.mapper.PostMapper;
import blog.models.Post;
import blog.repository.MediaRepository;
import blog.service.PostService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

  private final PostService postService;
  private final MediaRepository mediaRepository;

  public PostController(PostService postService, MediaRepository mediaRepository) {
    this.postService = postService;
    this.mediaRepository = mediaRepository;
  }

  @GetMapping("/feed")
  public List<PostSummaryDto> getFeed() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated())
      throw new RuntimeException("Unauthorized");
    return postService.getFeedForUser(auth.getName());
  }

  // Create
  @PostMapping
  public PostDetailDto create(
      @RequestParam String title,
      @RequestParam String description,
      @RequestParam(required = false) MultipartFile media,
    @RequestParam(required = false) List<UUID> categoryIds ) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated())
      throw new RuntimeException("Unauthorized");
   return postService.createPost(auth.getName(), title, description, media, categoryIds);
  }

  // Update (multipart to allow media change)

@PutMapping("/{id}")
public PostDetailDto update(
    @PathVariable UUID id,
    @RequestParam String title,
    @RequestParam String description,
    @RequestParam(required = false) MultipartFile media,
    @RequestParam(required = false) List<UUID> categoryIds
) {
  Authentication auth = SecurityContextHolder.getContext().getAuthentication();
  if (auth == null || !auth.isAuthenticated())
    throw new RuntimeException("Unauthorized");
  return postService.updatePost(auth.getName(), id, title, description, media, categoryIds);
}


  // Delete
  @DeleteMapping("/{id}")
  public void delete(@PathVariable UUID id) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated())
      throw new RuntimeException("Unauthorized");
    postService.deletePost(auth.getName(), id);
  }

  // Likes
  @PostMapping("/{postId}/like")
  public PostSummaryDto likePost(@PathVariable UUID postId, Authentication authentication) {
    String username = authentication.getName();
    postService.likePost(username, postId);
    Post post = postService.findPostById(postId);
    boolean isLiked = postService.isPostLikedByUser(postId, username);
    return PostMapper.toSummary(post, mediaRepository, isLiked);
  }

  @DeleteMapping("/{postId}/like")
  public PostSummaryDto unlikePost(@PathVariable UUID postId, Authentication authentication) {
    String username = authentication.getName();
    postService.unlikePost(username, postId);
    Post post = postService.findPostById(postId);
    boolean isLiked = postService.isPostLikedByUser(postId, username);
    return PostMapper.toSummary(post, mediaRepository, isLiked);
  }

  // Comments (basic)
  @PostMapping("/{postId}/comments")
  public void addComment(@PathVariable UUID postId, @RequestBody CommentReq req) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated())
      throw new RuntimeException("Unauthorized");
    postService.addComment(auth.getName(), postId, req.content());
  }

  @GetMapping("/{postId}/comments")
  public List<CommentDto> getComments(@PathVariable UUID postId) {
    return postService.getComments(postId);
  }

  @DeleteMapping("/{postId}/comments/{commentId}")
  public void deleteComment(@PathVariable UUID postId, @PathVariable UUID commentId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated())
      throw new RuntimeException("Unauthorized");
    postService.deleteComment(auth.getName(), postId, commentId);
  }

  // Detail
  @GetMapping("/{id}")
  public PostDetailDto getOne(@PathVariable UUID id) {
    return postService.getOne(id);
  }

  // Simple DTOs for comment endpoints
  public record CommentReq(String content) {
  }

  public record CommentDto(UUID id, UUID postId, String username, String text, String createdAt) {
  }
}
