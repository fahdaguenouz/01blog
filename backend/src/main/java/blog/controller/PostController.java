package blog.controller;

import blog.dto.CommentDto;
import blog.dto.CreateCommentRequest;
import blog.dto.PostDetailDto;
import blog.models.User;
import blog.repository.UserRepository;
import blog.service.posts.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

  private final PostFeedService feedService;
  private final PostReadService readService;
  private final PostCrudService crudService;
  private final PostLikeService likeService;
  private final PostSaveService saveService;
  private final PostCommentService commentService;
  private final UserRepository userRepository;

  public PostController(
      PostFeedService feedService,
      PostReadService readService,
      PostCrudService crudService,
      PostLikeService likeService,
      PostSaveService saveService,
      PostCommentService commentService,
      UserRepository userRepository) {
    this.feedService = feedService;
    this.readService = readService;
    this.crudService = crudService;
    this.likeService = likeService;
    this.saveService = saveService;
    this.commentService = commentService;
    this.userRepository = userRepository;
  }

  private static String requireUsername(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()
        || "anonymousUser".equals(authentication.getName())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return authentication.getName();
  }

  @GetMapping("/feed")
  public List<PostDetailDto> getFeed(
      @RequestParam(required = false) UUID categoryId,
      @RequestParam(defaultValue = "new") String sort,
      Authentication authentication) {
    return feedService.getFeedForUser(requireUsername(authentication), categoryId, sort);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public PostDetailDto create(
      @RequestParam("title") String title,
      @RequestParam("body") String body,
      @RequestParam("categoryIds") List<String> categoryIds,
      @RequestParam(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
      @RequestParam(value = "mediaDescriptions", required = false) List<String> mediaDescriptions,
      Authentication authentication) {
    List<UUID> ids;
    try {
      ids = categoryIds.stream().map(UUID::fromString).toList();
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid categoryIds");
    }

    return crudService.createPost(
        requireUsername(authentication),
        title, body,
        mediaFiles,
        ids,
        mediaDescriptions);
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public PostDetailDto update(
      @PathVariable UUID id,
      @RequestParam String title,
      @RequestParam String body,

      @RequestParam(required = false) List<MultipartFile> mediaFiles,
      @RequestParam(required = false) List<String> newDescriptions,

      @RequestParam(required = false) List<UUID> existingMediaIds,
      @RequestParam(required = false) List<Boolean> removeExistingFlags,
      @RequestParam(required = false) List<Boolean> replaceExistingFlags,
      @RequestParam(required = false) List<String> existingDescriptions,

      @RequestParam(required = false) List<MultipartFile> replacementFiles,
      @RequestParam(required = false) List<String> replacementDescriptions,

      @RequestParam List<UUID> categoryIds,
      Authentication authentication) {
    return crudService.updatePost(
        requireUsername(authentication),
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
        categoryIds);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID id, Authentication authentication) {
    crudService.deletePost(requireUsername(authentication), id);
  }

  @PostMapping("/{postId}/like")
  public PostDetailDto likePost(@PathVariable UUID postId, Authentication authentication) {
    return likeService.likeAndReturn(requireUsername(authentication), postId);
  }

  @DeleteMapping("/{postId}/like")
  public PostDetailDto unlikePost(@PathVariable UUID postId, Authentication authentication) {
    return likeService.unlikeAndReturn(requireUsername(authentication), postId);
  }

  @PostMapping("/{postId}/save")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void savePost(@PathVariable UUID postId, Authentication authentication) {
    saveService.savePost(requireUsername(authentication), postId);
  }

  @DeleteMapping("/{postId}/save")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void unsavePost(@PathVariable UUID postId, Authentication authentication) {
    saveService.unsavePost(requireUsername(authentication), postId);
  }

  @GetMapping("/user/{userId}/posts")
  public List<PostDetailDto> getUserPosts(@PathVariable UUID userId) {
    return readService.getPostsByAuthor(userId);
  }

  @GetMapping("/user/{userId}/liked")
  public List<PostDetailDto> getUserLikedPosts(@PathVariable UUID userId) {
    return readService.getLikedPostsForUser(userId);
  }

  @GetMapping("/user/{userId}/saved")
  public List<PostDetailDto> getUserSavedPosts(@PathVariable UUID userId) {
    return readService.getSavedPostsForUser(userId);
  }

  @PostMapping("/{postId}/comments")
  @ResponseStatus(HttpStatus.CREATED)
  public CommentDto addComment(
      @PathVariable UUID postId,
      @Valid @RequestBody CreateCommentRequest req,
      Authentication authentication) {
    return commentService.addComment(
        requireUsername(authentication),
        postId,
        req.content());
  }

  @GetMapping("/{postId}/comments")
  public List<CommentDto> getComments(@PathVariable UUID postId) {
    return commentService.getComments(postId);
  }

  @DeleteMapping("/{postId}/comments/{commentId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteComment(@PathVariable UUID postId, @PathVariable UUID commentId, Authentication authentication) {
    commentService.deleteComment(requireUsername(authentication), postId, commentId);
  }

  // Detail (anonymous allowed)
  @GetMapping("/{id}")
  public PostDetailDto getOne(@PathVariable UUID id, Authentication authentication) {
    UUID currentUserId = null;

    if (authentication != null && authentication.isAuthenticated()
        && !"anonymousUser".equals(authentication.getName())) {
      User user = userRepository.findByUsername(authentication.getName()).orElse(null);
      if (user != null)
        currentUserId = user.getId();
    }

    return readService.getOne(id, currentUserId);
  }

}
