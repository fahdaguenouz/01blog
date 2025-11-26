// src/main/java/blog/controller/PostController.java
package blog.controller;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.mapper.PostMapper;
import blog.models.Post;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
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
private final UserRepository userRepository;

   public PostController(PostService postService, MediaRepository mediaRepository, UserRepository userRepository) {
    this.postService = postService;
    this.mediaRepository = mediaRepository;
    this.userRepository = userRepository;
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
     boolean isSaved = false;
    boolean isLiked = postService.isPostLikedByUser(postId, username);
     return PostMapper.toSummary(post, mediaRepository, isLiked, isSaved);
  }

  @DeleteMapping("/{postId}/like")
  public PostSummaryDto unlikePost(@PathVariable UUID postId, Authentication authentication) {
    String username = authentication.getName();
    postService.unlikePost(username, postId);
    Post post = postService.findPostById(postId);
    boolean isLiked = postService.isPostLikedByUser(postId, username);
     boolean isSaved = false;
    return PostMapper.toSummary(post, mediaRepository, isLiked, isSaved);
  }


@GetMapping("/user/{userId}")
public List<PostSummaryDto> getUserPosts(@PathVariable UUID userId) {
  return postService.getPostsByAuthor(userId);
}

@GetMapping("/user/{userId}/liked")
public List<PostSummaryDto> getUserLikedPosts(@PathVariable UUID userId) {
  return postService.getLikedPostsForUser(userId);
}

@GetMapping("/user/{userId}/saved")
public List<PostSummaryDto> getUserSavedPosts(@PathVariable UUID userId) {
  return postService.getSavedPostsForUser(userId);
}
@PostMapping("/{postId}/save")
public void savePost(@PathVariable UUID postId, Authentication authentication) {
  String username = authentication.getName();
  postService.savePost(username, postId);
}

@DeleteMapping("/{postId}/save")
public void unsavePost(@PathVariable UUID postId, Authentication authentication) {
  String username = authentication.getName();
  postService.unsavePost(username, postId);
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
public PostDetailDto getOne(@PathVariable UUID id, Authentication authentication) {
  UUID currentUserId = null;
  if (authentication != null && authentication.isAuthenticated()) {
    String username = authentication.getName();
    User user = userRepository.findByUsername(username).orElse(null);  // use instance here
    if (user != null) {
      currentUserId = user.getId();
    }
  }
  return postService.getOne(id, currentUserId);
}



  // Simple DTOs for comment endpoints
  public record CommentReq(String content) {
  }

  public record CommentDto(UUID id, UUID postId, String username, String text, String createdAt) {
  }
}
