package blog.controller;

import blog.dto.PostDetailDto;
import blog.mapper.PostMapper;
import blog.models.Post;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.PostMediaRepository;
import blog.repository.UserRepository;
import blog.service.PostService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.MediaType;
import blog.dto.CommentDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

  private final PostService postService;
  private final MediaRepository mediaRepository;
private final UserRepository userRepository;

private final PostMediaRepository postMediaRepository;

   public PostController(PostService postService, PostMediaRepository postMediaRepository, MediaRepository mediaRepository, UserRepository userRepository) {
    this.postService = postService;
    this.postMediaRepository = postMediaRepository;
    this.mediaRepository = mediaRepository;
    this.userRepository = userRepository;
  }

 @GetMapping("/feed")
public List<PostDetailDto> getFeed(
    @RequestParam(required = false) UUID categoryId,
    @RequestParam(defaultValue = "new") String sort
) {
  Authentication auth = SecurityContextHolder.getContext().getAuthentication();
  if (auth == null || !auth.isAuthenticated() || auth.getName().equals("anonymousUser")) {
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required for feed");
  }
  try {
    return postService.getFeedForUser(auth.getName(), categoryId, sort);
  } catch (Exception ex) {
    System.err.printf("Error while building feed for user {} (category={}, sort={})", auth.getName(), categoryId, sort, ex);
    // rethrow as 500 with a clear message — stack trace is in the logs
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build feed: " + ex.getMessage());
  }
}


  // Create
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public PostDetailDto create(
  @RequestParam String title,
  @RequestParam String body,
  @RequestParam(required = false) List<MultipartFile> mediaFiles,
  @RequestParam(required = false) List<UUID> categoryIds,
  @RequestParam(required = false) List<String> mediaDescriptions
) {
  Authentication auth = SecurityContextHolder.getContext().getAuthentication();
  if (auth == null || !auth.isAuthenticated())
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

  return postService.createPost(
    auth.getName(),
    title,
    body,
    mediaFiles,
    categoryIds,
    mediaDescriptions
  );
}


  // Update (multipart to allow media change)
@PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public PostDetailDto update(
    @PathVariable UUID id,
    @RequestParam String title,
    @RequestParam String body,

    // new
    @RequestParam(required = false) List<MultipartFile> mediaFiles,
    @RequestParam(required = false) List<String> newDescriptions,

    // existing
    @RequestParam(required = false) List<UUID> existingMediaIds,
    @RequestParam(required = false) List<Boolean> removeExistingFlags,
    @RequestParam(required = false) List<Boolean> replaceExistingFlags,
    @RequestParam(required = false) List<String> existingDescriptions,

    // replacements (aligned by replacementFiles index)
    @RequestParam(required = false) List<MultipartFile> replacementFiles,
    @RequestParam(required = false) List<String> replacementDescriptions,

    // categories
    @RequestParam List<UUID> categoryIds
) {
  Authentication auth = SecurityContextHolder.getContext().getAuthentication();
  if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  return postService.updatePost(
      auth.getName(),
      id,
      title,
      body,
      mediaFiles,
      newDescriptions,
      existingMediaIds,
      removeExistingFlags,
      replaceExistingFlags,
      existingDescriptions,
      replacementFiles,
      replacementDescriptions,
      categoryIds
  );
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
public PostDetailDto likePost(@PathVariable UUID postId, Authentication authentication) {
  String username = authentication.getName();
  return postService.likeAndReturn(username, postId);
}

@DeleteMapping("/{postId}/like")
public PostDetailDto unlikePost(@PathVariable UUID postId, Authentication authentication) {
  String username = authentication.getName();
  return postService.unlikeAndReturn(username, postId);
}


@GetMapping("/user/{userId}/posts") 
public List<PostDetailDto> getUserPosts(@PathVariable UUID userId) {
  return postService.getPostsByAuthor(userId);
}

@GetMapping("/user/{userId}/liked")
public List<PostDetailDto> getUserLikedPosts(@PathVariable UUID userId) {
  return postService.getLikedPostsForUser(userId);
}

@GetMapping("/user/{userId}/saved")
public List<PostDetailDto> getUserSavedPosts(@PathVariable UUID userId) {
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


}
