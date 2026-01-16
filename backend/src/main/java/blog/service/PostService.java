
package blog.service;

import blog.dto.*;
import blog.enums.NotificationType;
import blog.mapper.PostMapper;
import blog.models.*;
import blog.repository.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class PostService {

  private final PostRepository posts;
  private final UserRepository users;
  private final LikeRepository likes;
  private final MediaRepository mediaRepo;
  private final CommentRepository comments;
  private final LocalMediaStorage mediaStorage;
  private final CategoryRepository categories;
  private final PostCategoryRepository postCategories;
  private final SavedPostRepository savedPosts;
  private final PostMediaRepository postMediaRepository;
  private final NotificationService notificationService;
  private final SubscriptionRepository subscriptions;
  private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]*>");

  public PostService(
      PostRepository posts,
      UserRepository users,
      CommentRepository comments,
      MediaRepository mediaRepo,
      LikeRepository likes,
      LocalMediaStorage mediaStorage,
      CategoryRepository categories,
      PostCategoryRepository postCategories,
      SavedPostRepository savedPosts,
      PostMediaRepository postMediaRepository,
      NotificationService notificationService,
      SubscriptionRepository subscriptions) {
    this.posts = posts;
    this.users = users;
    this.comments = comments;
    this.mediaRepo = mediaRepo;
    this.mediaStorage = mediaStorage;
    this.likes = likes;
    this.categories = categories;
    this.postCategories = postCategories;
    this.savedPosts = savedPosts;
    this.postMediaRepository = postMediaRepository;
    this.notificationService = notificationService;
    this.subscriptions = subscriptions;
  }

  /*
   * ============================================================
   * Helpers
   * ============================================================
   */

  private String requireCleanText(String value, String field, int maxLen) {
    if (value == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
    }

    String v = value.trim();

    if (v.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " cannot be blank");
    }

    if (maxLen > 0 && v.length() > maxLen) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is too long");
    }

    // Reject HTML tags (basic XSS protection)
    if (HTML_TAG_PATTERN.matcher(v).find()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " cannot contain HTML");
    }

    return v;
  }

  private User requireUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  private UUID userIdOrNull(String username) {
    if (username == null)
      return null;
    return users.findByUsername(username).map(User::getId).orElse(null);
  }

  private List<CategoryDto> getCategoryDtos(UUID postId) {
    return postCategories.findByPostId(postId).stream()
        .map(pc -> categories.findById(pc.getCategoryId())
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
            .orElse(null))
        .filter(Objects::nonNull)
        .toList();
  }

  private PostDetailDto toDetail(Post post, UUID userId) {
    List<CategoryDto> categoryDtos = getCategoryDtos(post.getId());
    boolean isLiked = userId != null && likes.findByUserIdAndPostId(userId, post.getId()).isPresent();
    boolean isSaved = userId != null && savedPosts.findByUserIdAndPostId(userId, post.getId()).isPresent();
    return PostMapper.toDetail(post, mediaRepo, postMediaRepository, categoryDtos, isLiked, isSaved);
  }

  /** When you already know the flags and want fewer queries. */
  private PostDetailDto toDetail(Post post, boolean isLiked, boolean isSaved) {
    List<CategoryDto> categoryDtos = getCategoryDtos(post.getId());
    return PostMapper.toDetail(post, mediaRepo, postMediaRepository, categoryDtos, isLiked, isSaved);
  }

  private void assertOwner(Post post, User user) {
    if (post.getAuthor() == null || !post.getAuthor().getId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
  }

  private void assertVisibleToUser(Post post, UUID currentUserId) {
    if ("hidden".equalsIgnoreCase(post.getStatus())) {
      boolean isOwner = currentUserId != null
          && post.getAuthor() != null
          && currentUserId.equals(post.getAuthor().getId());

      if (!isOwner) {
        // hide existence
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
      }
    }
  }

  /*
   * ============================================================
   * Create
   * ============================================================
   */

  public PostDetailDto createPost(
      String username,
      String title,
      String body,
      List<MultipartFile> mediaFiles,
      List<UUID> categoryIds,
      List<String> mediaDescriptions) {
    User user = requireUser(username);
    title = requireCleanText(title, "Title", 150);
    body = requireCleanText(body, "Body", 10000);
    Post post = new Post();
    post.setAuthor(user);
    post.setTitle(title);
    post.setBody(body);
    post.setStatus("active");
    post = posts.save(post);

    List<UUID> subscriberIds = subscriptions.findSubscriberIdsBySubscribedToId(user.getId());
    if (subscriberIds != null && !subscriberIds.isEmpty()) {
      // load all subscribers as User entities (batch)
      List<User> subs = users.findAllById(subscriberIds);

      for (User target : subs) {
        // NotificationService.notify already ignores self-notification,
        // but extra safety is fine:
        if (target.getId().equals(user.getId()))
          continue;

        notificationService.notify(
            target,
            user,
            NotificationType.FOLLOWING_POSTED,
            post);
      }
    }

    // -------- MEDIA (positions start at 1) --------
    if (mediaFiles != null && !mediaFiles.isEmpty()) {
      postMediaRepository.deleteByPostId(post.getId());

      for (int i = 0; i < mediaFiles.size(); i++) {
        MultipartFile file = mediaFiles.get(i);
        if (file == null || file.isEmpty())
          continue;

        var stored = mediaStorage.save(file);
        if (stored == null)
          continue;

        Media media = new Media();
        media.setUserId(user.getId());
        media.setMediaType(file.getContentType());
        media.setSize((int) file.getSize());
        media.setUrl(stored.url());
        media.setUploadedAt(OffsetDateTime.now());
        Media savedMedia = mediaRepo.save(media);

        String description = null;

        if (mediaDescriptions != null && mediaDescriptions.size() > i) {
          String raw = mediaDescriptions.get(i);

          raw = requireCleanText(raw, "Media description", 500);
        }
        if (description == null || description.isBlank()) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each media must have a description");
        }

        PostMedia pm = new PostMedia();
        pm.setPostId(post.getId());
        pm.setMediaId(savedMedia.getId());
        pm.setDescription(description);
        pm.setPosition(i + 1); // ✅ important: 1-based positions
        pm.setCreatedAt(Instant.now());
        postMediaRepository.save(pm);
      }
    }

    // -------- CATEGORIES --------
    if (categoryIds != null) {
      for (UUID cid : categoryIds) {
        if (cid == null)
          continue;
        if (!categories.existsById(cid))
          continue;

        PostCategory pc = new PostCategory();
        pc.setPostId(post.getId());
        pc.setCategoryId(cid);
        postCategories.save(pc);
      }
    }

    return toDetail(post, (UUID) null); // author creating it -> flags false
  }

  /*
   * ============================================================
   * Read
   * ============================================================
   */

  public PostDetailDto getOne(UUID id, UUID currentUserId) {
    Post post = requirePost(id);
    assertVisibleToUser(post, currentUserId);
    return toDetail(post, currentUserId);
  }

  /** FEED for logged-in users */
  public List<PostDetailDto> getFeedForUser(String username, UUID categoryId, String sort) {
    User user = requireUser(username);
    UUID userId = user.getId();

    List<Post> base;
    if (categoryId != null) {
      base = posts.findByCategoryAndStatus(categoryId, "active");
    } else {
      base = posts.findByStatus("active");
    }

    Comparator<Post> comparator;
    switch (sort) {
      case "likes" -> comparator = Comparator.comparing(
          p -> Optional.ofNullable(p.getLikesCount()).orElse(0),
          Comparator.reverseOrder());
      case "saved" -> comparator = Comparator.comparing(
          p -> savedPosts.countByPostId(p.getId()),
          Comparator.reverseOrder());
      case "new" -> comparator = Comparator.comparing(
          Post::getCreatedAt,
          Comparator.nullsLast(Comparator.reverseOrder()));
      default -> comparator = Comparator.comparing(
          Post::getCreatedAt,
          Comparator.nullsLast(Comparator.reverseOrder()));
    }

    base.sort(comparator);

    // NOTE: This will still do a few queries per post
    // (liked/saved/categories/media).
    // If you want a final optimization pass later, we can batch-fetch
    // likes/saves/categories/media.
    return base.stream()
        .map(p -> toDetail(p, userId))
        .toList();
  }

  public List<PostDetailDto> getPostsByAuthor(UUID userId) {
    List<Post> result = posts.findByAuthorIdAndStatusOrderByCreatedAtDesc(userId, "active");
    return result.stream().map(p -> toDetail(p, false, false)).toList();
  }

  public List<PostDetailDto> getLikedPostsForUser(UUID userId) {
    var liked = likes.findByUserId(userId);
    var postIds = liked.stream().map(Like::getPostId).toList();
    if (postIds.isEmpty())
      return List.of();

    return posts.findByIdInAndStatusOrderByCreatedAtDesc(postIds, "active")
        .stream()
        .map(p -> {
          boolean isSaved = savedPosts.findByUserIdAndPostId(userId, p.getId()).isPresent();
          return toDetail(p, true, isSaved);
        })
        .toList();
  }

  public List<PostDetailDto> getSavedPostsForUser(UUID userId) {
    var saved = savedPosts.findByUserId(userId);
    var postIds = saved.stream().map(SavedPost::getPostId).toList();
    if (postIds.isEmpty())
      return List.of();

    return posts.findByIdInAndStatusOrderByCreatedAtDesc(postIds, "active")
        .stream()
        .map(p -> {
          boolean isLiked = likes.findByUserIdAndPostId(userId, p.getId()).isPresent();
          return toDetail(p, isLiked, true);
        })
        .toList();
  }

  /*
   * ============================================================
   * Like / Unlike
   * ============================================================
   */

  public void likePost(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);

    boolean alreadyLiked = likes.findByUserIdAndPostId(user.getId(), postId).isPresent();
    if (alreadyLiked)
      return;

    Like like = new Like();
    like.setUserId(user.getId());
    like.setPostId(postId);
    likes.save(like);

    int newCount = likes.countByPostId(postId);
    post.setLikesCount(Math.max(newCount, 0));
    posts.save(post);
    posts.flush();

    notificationService.notify(post.getAuthor(), user, NotificationType.POST_LIKED, post);
  }

  public void unlikePost(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);

    likes.findByUserIdAndPostId(user.getId(), postId).ifPresent(like -> {
      likes.delete(like);

      int newCount = likes.countByPostId(postId);
      post.setLikesCount(Math.max(newCount, 0));
      posts.save(post);
      posts.flush();
    });
  }

  public PostDetailDto likeAndReturn(String username, UUID postId) {
    User user = requireUser(username);
    likePost(username, postId);
    Post post = requirePost(postId);
    return toDetail(post, user.getId());
  }

  public PostDetailDto unlikeAndReturn(String username, UUID postId) {
    User user = requireUser(username);
    unlikePost(username, postId);
    Post post = requirePost(postId);
    return toDetail(post, user.getId());
  }

  /*
   * ============================================================
   * Update
   * ============================================================
   */

  public PostDetailDto updatePost(
      String username,
      UUID postId,
      String title,
      String body,
      List<MultipartFile> newMediaFiles, // for new blocks
      List<String> newDescriptions,
      List<UUID> existingMediaIds,
      List<Boolean> removeExistingFlags,
      List<Boolean> replaceExistingFlags,
      List<String> existingDescriptions,
      List<MultipartFile> replacementFiles, // only for replaced existing blocks
      List<String> replacementDescriptions,
      List<UUID> categoryIds) {
    User user = requireUser(username);
    Post post = requirePost(postId);
    assertOwner(post, user);

    if (categoryIds == null || categoryIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post must have at least one category");
    }
    title = requireCleanText(title, "Title", 150);
    body = requireCleanText(body, "Body", 10000);
    post.setTitle(title);
    post.setBody(body);
    posts.save(post);

    // Load current post media
    List<PostMedia> existingMedia = postMediaRepository.findByPostIdOrderByPositionAsc(postId);
    Map<UUID, PostMedia> dbMap = existingMedia.stream()
        .collect(Collectors.toMap(PostMedia::getId, pm -> pm));

    Set<UUID> seen = new HashSet<>();
    List<PostMedia> kept = new ArrayList<>();

    int replIdx = 0;

    // ----- EXISTING MEDIA (keep/remove/replace) -----
    if (existingMediaIds != null) {
      for (int i = 0; i < existingMediaIds.size(); i++) {
        UUID pmId = existingMediaIds.get(i);
        if (pmId == null)
          continue;

        PostMedia pm = dbMap.get(pmId);
        if (pm == null)
          continue;

        seen.add(pmId);

        boolean remove = removeExistingFlags != null && removeExistingFlags.size() > i
            && Boolean.TRUE.equals(removeExistingFlags.get(i));

        boolean replace = replaceExistingFlags != null && replaceExistingFlags.size() > i
            && Boolean.TRUE.equals(replaceExistingFlags.get(i));

        String desc = (existingDescriptions != null && existingDescriptions.size() > i)
            ? existingDescriptions.get(i)
            : null;

        if (remove) {
          postMediaRepository.delete(pm);
          continue;
        }

        if (replace) {
          if (replacementFiles == null || replIdx >= replacementFiles.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Replacement file missing");
          }

          MultipartFile file = replacementFiles.get(replIdx);

          String replDesc = (replacementDescriptions != null && replIdx < replacementDescriptions.size())
              ? replacementDescriptions.get(replIdx)
              : desc;

          var stored = mediaStorage.save(file);
          if (stored == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store media");
          }

          Media media = new Media();
          media.setUserId(user.getId());
          media.setUrl(stored.url());
          media.setMediaType(file.getContentType());
          media.setSize((int) file.getSize());
          media.setUploadedAt(OffsetDateTime.now());
          Media saved = mediaRepo.save(media);

          pm.setMediaId(saved.getId());
          desc = requireCleanText(desc, "Media description", 500);
          replDesc = requireCleanText(replDesc, "Media description", 500);
          pm.setDescription(replDesc);
          replIdx++;
        } else {
          pm.setDescription(desc);
        }

        kept.add(pm);
      }
    }

    // ✅ delete DB media that the client did not send back (extra safety)
    for (PostMedia pm : existingMedia) {
      if (!seen.contains(pm.getId())) {
        postMediaRepository.delete(pm);
      }
    }

    // ✅ flush deletions first
    postMediaRepository.flush();

    // ✅ 2-PHASE POSITION UPDATE (prevents uq_post_media_position conflicts)
    int tmp = 1000;
    for (PostMedia pm : kept) {
      pm.setPosition(tmp++);
    }
    postMediaRepository.saveAll(kept);
    postMediaRepository.flush();

    int position = 1;
    for (PostMedia pm : kept) {
      pm.setPosition(position++);
    }
    postMediaRepository.saveAll(kept);
    postMediaRepository.flush();

    // ----- NEW MEDIA (append after kept) -----
    if (newMediaFiles != null) {
      for (int i = 0; i < newMediaFiles.size(); i++) {
        MultipartFile file = newMediaFiles.get(i);
        if (file == null || file.isEmpty())
          continue;

        String desc = (newDescriptions != null && newDescriptions.size() > i)
            ? newDescriptions.get(i)
            : null;

        var stored = mediaStorage.save(file);
        if (stored == null) {
          throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store media");
        }

        Media media = new Media();
        media.setUserId(user.getId());
        media.setUrl(stored.url());
        media.setMediaType(file.getContentType());
        media.setSize((int) file.getSize());
        media.setUploadedAt(OffsetDateTime.now());
        Media saved = mediaRepo.save(media);

        PostMedia pm = new PostMedia();
        pm.setPostId(postId);
        pm.setMediaId(saved.getId());
        desc = requireCleanText(desc, "Media description", 500);
        pm.setDescription(desc);
        pm.setPosition(position++); // continue positions
        pm.setCreatedAt(Instant.now());
        postMediaRepository.save(pm);
      }
    }

    // ----- CATEGORIES (replace all) -----
    postCategories.deleteByPostId(postId);
    for (UUID cid : categoryIds) {
      if (cid == null)
        continue;
      if (!categories.existsById(cid))
        continue;

      PostCategory pc = new PostCategory();
      pc.setPostId(postId);
      pc.setCategoryId(cid);
      postCategories.save(pc);
    }

    return toDetail(post, user.getId());
  }

  /*
   * ============================================================
   * Delete
   * ============================================================
   */

  public void deletePost(String username, UUID id) {
    User user = requireUser(username);
    Post post = requirePost(id);
    assertOwner(post, user);

    likes.deleteByPostId(post.getId());
    comments.deleteByPostId(post.getId());

    // Optional: also delete saved posts and post media links if you have repos for
    // them
    // savedPosts.deleteByPostId(post.getId());
    // postMediaRepository.deleteByPostId(post.getId());
    // postCategories.deleteByPostId(post.getId());

    posts.delete(post);
  }

  /*
   * ============================================================
   * Comments
   * ============================================================
   */

  public void addComment(String username, UUID postId, String content) {
    User user = requireUser(username);
    Post post = requirePost(postId);

    Comment c = new Comment();
    c.setId(UUID.randomUUID());
    c.setPostId(post.getId());
    c.setUserId(user.getId());
    c.setText(content);
    c.setCreatedAt(OffsetDateTime.now());
    comments.saveAndFlush(c);

    int current = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
    post.setCommentsCount(current + 1);
    posts.saveAndFlush(post);

    notificationService.notify(post.getAuthor(), user, NotificationType.POST_COMMENTED, post);
  }

  public List<CommentDto> getComments(UUID postId) {
    return comments.findByPostIdOrderByCreatedAtDesc(postId).stream()
        .map(c -> {
          User user = users.findById(c.getUserId()).orElse(null);
          String username = user != null ? user.getUsername() : "user";

          String avatarUrl = "svg/avatar.png";
          if (user != null && user.getAvatarMediaId() != null) {
            avatarUrl = mediaRepo.findById(user.getAvatarMediaId())
                .map(Media::getUrl)
                .orElse("svg/avatar.png");
          }

          return new CommentDto(
              c.getId(),
              c.getPostId(),
              c.getUserId(),
              username,
              avatarUrl,
              c.getText(),
              c.getCreatedAt().toString());
        })
        .toList();
  }

  public void deleteComment(String username, UUID postId, UUID commentId) {
    User user = requireUser(username);

    Comment c = comments.findById(commentId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    if (!c.getPostId().equals(postId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment does not belong to this post");
    }

    Post post = requirePost(postId);

    boolean isCommentOwner = c.getUserId().equals(user.getId());
    boolean isPostOwner = post.getAuthor() != null && post.getAuthor().getId().equals(user.getId());

    if (!isCommentOwner && !isPostOwner) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }

    comments.delete(c);

    int current = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
    post.setCommentsCount(Math.max(0, current - 1));
    posts.saveAndFlush(post);
  }

  /*
   * ============================================================
   * Save / Unsave
   * ============================================================
   */

  public void savePost(String username, UUID postId) {
    User user = requireUser(username);

    Optional<SavedPost> existing = savedPosts.findByUserIdAndPostId(user.getId(), postId);
    if (existing.isPresent())
      return;

    SavedPost savedPost = new SavedPost();
    savedPost.setUserId(user.getId());
    savedPost.setPostId(postId);
    savedPosts.save(savedPost);

    Post post = requirePost(postId);
    notificationService.notify(post.getAuthor(), user, NotificationType.POST_SAVED, post);
  }

  public void unsavePost(String username, UUID postId) {
    User user = requireUser(username);
    savedPosts.findByUserIdAndPostId(user.getId(), postId).ifPresent(savedPosts::delete);
  }

  /*
   * ============================================================
   * Admin
   * ============================================================
   */

  public void adminSetPostStatus(UUID postId, String status) {
    if (!"active".equalsIgnoreCase(status) && !"hidden".equalsIgnoreCase(status)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    }

    Post post = requirePost(postId);
    post.setStatus(status.toLowerCase());
    posts.save(post);
  }

  /*
   * ============================================================
   * Small utilities still used in some places
   * ============================================================
   */

  public Post findPostById(UUID postId) {
    return requirePost(postId);
  }

  public boolean isPostLikedByUser(UUID postId, String username) {
    User user = requireUser(username);
    return likes.findByUserIdAndPostId(user.getId(), postId).isPresent();
  }

  /** If you ever need it on controller side. */
  public UUID getUserIdByUsername(String username) {
    return userIdOrNull(username);
  }
}
