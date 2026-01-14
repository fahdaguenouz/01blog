package blog.service;

import blog.controller.PostController;
import blog.dto.*;
import blog.enums.NotificationType;
import blog.mapper.PostMapper;
import blog.models.*;

import blog.repository.*;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.OffsetDateTime;

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

  public PostService(PostRepository posts, UserRepository users, CommentRepository comments,
      MediaRepository mediaRepo, LikeRepository likes,
      LocalMediaStorage mediaStorage,
      CategoryRepository categories,
      PostCategoryRepository postCategories,
      SavedPostRepository savedPosts,
      PostMediaRepository postMediaRepository,
      NotificationService notificationService) {
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
  }

  public PostDetailDto createPost(
      String username,
      String title,
      String body,
      List<MultipartFile> mediaFiles,
      List<UUID> categoryIds,
      List<String> mediaDescriptions) {
    User user = users.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Post post = new Post();
    post.setAuthor(user);
    post.setTitle(title);
    post.setBody(body);
    post.setStatus("active");
    post = posts.save(post);

    // -------- MEDIA --------
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
          description = mediaDescriptions.get(i);
        }

        PostMedia pm = new PostMedia();
        pm.setPostId(post.getId());
        pm.setMediaId(savedMedia.getId());
        pm.setDescription(description);
        pm.setPosition(i);
        pm.setCreatedAt(Instant.now());
        postMediaRepository.save(pm);
      }
    }

    // -------- CATEGORIES --------
    if (categoryIds != null) {
      for (UUID cid : categoryIds) {
        if (!categories.existsById(cid))
          continue;
        PostCategory pc = new PostCategory();
        pc.setPostId(post.getId());
        pc.setCategoryId(cid);
        postCategories.save(pc);
      }
    }

    List<CategoryDto> categoryDtos = postCategories.findByPostId(post.getId()).stream()
        .map(pc -> categories.findById(pc.getCategoryId())
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
            .orElse(null))
        .filter(Objects::nonNull)
        .toList();

    List<PostMediaDto> mediaDtos = postMediaRepository.findByPostIdOrderByPositionAsc(post.getId()).stream()
        .map(pm -> {
          Media m = mediaRepo.findById(pm.getMediaId()).orElse(null);
          if (m == null)
            return null;
          return new PostMediaDto(
              pm.getId(),
              m.getId(),
              m.getUrl(),
              m.getMediaType(),
              pm.getDescription(),
              pm.getPosition());
        })
        .filter(Objects::nonNull)
        .toList();

    return PostMapper.toDetail(
        post,
        mediaRepo,
        categoryDtos,
        mediaDtos,
        false,
        false);
  }

  // ✅ Public posts for guests
  public Page<PostSummaryDto> listPublic(String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByStatusOrderByCreatedAtDesc(status, pageable)
        .map(p -> PostMapper.toSummary(
            p,
            mediaRepo,
            postMediaRepository,
            false,
            false));
  }

  public Page<PostSummaryDto> listByAuthor(UUID userId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByAuthorIdAndStatus(userId, status, pageable)
        .map(p -> PostMapper.toSummary(
            p,
            mediaRepo,
            postMediaRepository,
            false,
            false));
  }

  public PostDetailDto getOne(UUID id, UUID currentUserId) {
    Post p = posts.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

    if ("hidden".equalsIgnoreCase(p.getStatus())) {
      if (currentUserId == null || !p.getAuthor().getId().equals(currentUserId)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
      }
    }

    List<CategoryDto> categoryDtos = postCategories.findByPostId(p.getId()).stream()
        .map(pc -> categories.findById(pc.getCategoryId())
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
            .orElse(null))
        .filter(Objects::nonNull)
        .toList();

    List<PostMediaDto> mediaDtos = postMediaRepository.findByPostIdOrderByPositionAsc(p.getId()).stream()
        .map(pm -> {
          Media m = mediaRepo.findById(pm.getMediaId()).orElse(null);
          if (m == null)
            return null;
          return new PostMediaDto(
              pm.getId(),
              m.getId(),
              m.getUrl(),
              m.getMediaType(),
              pm.getDescription(),
              pm.getPosition());
        })
        .filter(Objects::nonNull)
        .toList();

    boolean isLiked = currentUserId != null && likes.findByUserIdAndPostId(currentUserId, id).isPresent();

    boolean isSaved = currentUserId != null && savedPosts.findByUserIdAndPostId(currentUserId, id).isPresent();

    return PostMapper.toDetail(
        p,
        mediaRepo,
        categoryDtos,
        mediaDtos,
        isLiked,
        isSaved);
  }

  // ✅ FEED for logged-in users
  public List<PostSummaryDto> getFeedForUser(String username, UUID categoryId, String sort) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    UUID userId = user.getId();

    // Basic query: active posts
    List<Post> base;
    if (categoryId != null) {
      // posts by category via join table
      base = posts.findByCategoryAndStatus(categoryId, "active");
    } else {
      base = posts.findByStatus("active");
    }

    // sort
    Comparator<Post> comparator;
    switch (sort) {
      case "likes":
        comparator = Comparator.comparing(
            p -> Optional.ofNullable(p.getLikesCount()).orElse(0), Comparator.reverseOrder());
        break;
      case "saved":
        comparator = Comparator.comparing(
            p -> savedPosts.countByPostId(p.getId()), Comparator.reverseOrder());
        break;
      case "new":
      default:
        comparator = Comparator.comparing(Post::getCreatedAt,
            Comparator.nullsLast(Comparator.reverseOrder())); // ✅ Safe null handling
        break;
    }

    base.sort(comparator);

    return base.stream()
        .map(p -> {
          boolean isLiked = likes.findByUserIdAndPostId(userId, p.getId()).isPresent();
          boolean isSaved = savedPosts.findByUserIdAndPostId(userId, p.getId()).isPresent();
          return PostMapper.toSummary(
              p,
              mediaRepo,
              postMediaRepository,
              isLiked,
              isSaved);

        })
        .toList();
  }

  // ✅ Like post
  public void likePost(String username, UUID postId) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Post post = posts.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));

    boolean alreadyLiked = likes.findByUserIdAndPostId(user.getId(), postId).isPresent();
    if (alreadyLiked)
      return; // prevent duplicates

    Like like = new Like();
    like.setUserId(user.getId());
    like.setPostId(postId);
    likes.save(like);

    // update likes count cached in post entity
    int newCount = likes.countByPostId(postId);
    post.setLikesCount(Math.max(newCount, 0));
    posts.save(post);
    posts.flush();

    notificationService.notify(
        post.getAuthor(),
        user,
        NotificationType.POST_LIKED,
        post);

  }

  // ✅ Unlike post
  public void unlikePost(String username, UUID postId) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Post post = posts.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));

    likes.findByUserIdAndPostId(user.getId(), postId).ifPresent(like -> {
      likes.delete(like);
      int newCount = likes.countByPostId(postId);
      post.setLikesCount(newCount);
      posts.save(post);
      posts.flush();
    });
  }

  @Transactional
  public PostDetailDto updatePost(
      String username,
      UUID postId,
      String title,
      String body,
      List<MultipartFile> newMediaFiles,
      List<String> mediaDescriptions,
      List<UUID> existingMediaIds,
      List<Boolean> removeExistingFlags,
      List<UUID> categoryIds) {

    User user = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

    Post post = posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    if (!post.getAuthor().getId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    post.setTitle(title);
    post.setBody(body);
    posts.save(post);

    /* ---------- LOAD CURRENT MEDIA ---------- */
    List<PostMedia> existingMedia = postMediaRepository.findByPostIdOrderByPositionAsc(postId);

    Map<UUID, PostMedia> dbMap = existingMedia.stream()
        .collect(Collectors.toMap(PostMedia::getId, pm -> pm));

    int position = 1;

    /* ---------- EXISTING MEDIA ---------- */
    if (existingMediaIds != null) {
      for (int i = 0; i < existingMediaIds.size(); i++) {
        UUID id = existingMediaIds.get(i);
        boolean remove = removeExistingFlags != null
            && removeExistingFlags.size() > i
            && Boolean.TRUE.equals(removeExistingFlags.get(i));

        PostMedia pm = dbMap.get(id);
        if (pm == null)
          continue;

        if (remove) {
          postMediaRepository.delete(pm);
        } else {
          pm.setDescription(
              mediaDescriptions != null && mediaDescriptions.size() > i
                  ? mediaDescriptions.get(i)
                  : null);
          pm.setPosition(position++);
          postMediaRepository.save(pm);
        }
      }
    }

    /* ---------- NEW MEDIA ---------- */
    if (newMediaFiles != null) {
      for (MultipartFile file : newMediaFiles) {
        if (file.isEmpty())
          continue;

        var stored = mediaStorage.save(file);

        Media media = new Media();
        media.setUserId(user.getId());
        media.setUrl(stored.url());
        media.setMediaType(file.getContentType());
        media.setSize((int) file.getSize());
        mediaRepo.save(media);

        PostMedia pm = new PostMedia();
        pm.setPostId(postId);
        pm.setMediaId(media.getId());
        pm.setPosition(position++);
        pm.setCreatedAt(Instant.now());
        postMediaRepository.save(pm);
      }
    }

    /* ---------- CATEGORIES ---------- */
    postCategories.deleteByPostId(postId);
    if (categoryIds != null) {
      categoryIds.forEach(cid -> {
        PostCategory pc = new PostCategory();
        pc.setPostId(postId);
        pc.setCategoryId(cid);
        postCategories.save(pc);
      });
    }

    List<CategoryDto> categoryDtos = postCategories.findByPostId(postId).stream()
        .map(pc -> categories.findById(pc.getCategoryId())
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
            .orElse(null))
        .filter(Objects::nonNull)
        .toList();

    List<PostMediaDto> mediaDtos = postMediaRepository
        .findByPostIdOrderByPositionAsc(postId)
        .stream()
        .map(pm -> {
          Media m = mediaRepo.findById(pm.getMediaId()).orElse(null);
          if (m == null)
            return null;

          return new PostMediaDto(
              pm.getId(),
              m.getId(),
              m.getUrl(),
              m.getMediaType(),
              pm.getDescription(),
              pm.getPosition());
        })
        .filter(Objects::nonNull)
        .toList();

    return PostMapper.toDetail(
        post,
        mediaRepo,
        categoryDtos,
        mediaDtos,
        false,
        false);

  }

  public void deletePost(String username, UUID id) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Post post = posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    if (!post.getAuthor().getId().equals(user.getId())) {
      throw new IllegalArgumentException("Forbidden");
    }
    // 1) delete likes for this post
    likes.deleteByPostId(post.getId());

    // 2) delete comments for this post (recommended)
    comments.deleteByPostId(post.getId());
    posts.delete(post);
  }

  public void addComment(String username, UUID postId, String content) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Post post = posts.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));

    Comment c = new Comment();
    c.setId(UUID.randomUUID());
    c.setPostId(post.getId());
    c.setUserId(user.getId());
    c.setText(content);
    c.setCreatedAt(OffsetDateTime.now());
    comments.saveAndFlush(c);
    ;

    int currentCommentsCount = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
    post.setCommentsCount(currentCommentsCount + 1);
    posts.saveAndFlush(post);

    notificationService.notify(
        post.getAuthor(),
        user,
        NotificationType.POST_COMMENTED,
        post);

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
  User user = users.findByUsername(username)
      .orElseThrow(() -> new IllegalArgumentException("User not found"));

  Comment c = comments.findById(commentId)
      .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

  // safety: comment must belong to that post
  if (!c.getPostId().equals(postId)) {
    throw new IllegalArgumentException("Comment does not belong to this post");
  }

  Post post = posts.findById(postId)
      .orElseThrow(() -> new IllegalArgumentException("Post not found"));

  boolean isCommentOwner = c.getUserId().equals(user.getId());
  boolean isPostOwner = post.getAuthor() != null && post.getAuthor().getId().equals(user.getId());

  if (!isCommentOwner && !isPostOwner) {
    throw new IllegalArgumentException("Forbidden");
  }

  comments.delete(c);

  // ✅ optional but recommended: decrement post.comments_count safely
  int current = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
  post.setCommentsCount(Math.max(0, current - 1));
  posts.saveAndFlush(post);
}


  public void savePost(String username, UUID postId) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    // prevent duplicates
    Optional<SavedPost> existing = savedPosts.findByUserIdAndPostId(user.getId(), postId);
    if (existing.isPresent())
      return;

    SavedPost savedPost = new SavedPost();
    savedPost.setUserId(user.getId());
    savedPost.setPostId(postId);
    savedPosts.save(savedPost);

    Post post = posts.findById(postId)
        .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    notificationService.notify(
        post.getAuthor(),
        user,
        NotificationType.POST_SAVED,
        post);

  }

  public void unsavePost(String username, UUID postId) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    savedPosts.findByUserIdAndPostId(user.getId(), postId).ifPresent(savedPosts::delete);
  }

  public Post findPostById(UUID postId) {
    return posts.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
  }

  public boolean isPostLikedByUser(UUID postId, String username) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    return likes.findByUserIdAndPostId(user.getId(), postId).isPresent();
  }

  public List<PostSummaryDto> getPostsByAuthor(UUID userId) {
    // System.out.println("🔍 [PostService] getPostsByAuthor START: " + userId);
    long start = System.currentTimeMillis();

    List<Post> result = posts.findByAuthorIdAndStatusOrderByCreatedAtDesc(userId, "active");

    long queryTime = System.currentTimeMillis() - start;
    // System.out.println("✅ [PostService] Query END: " + queryTime + "ms");

    long mapStart = System.currentTimeMillis();
    List<PostSummaryDto> dtos = result.stream()
        .map(p -> PostMapper.toSummary(
            p,
            mediaRepo,
            postMediaRepository,
            false,
            false))
        .toList();

    // long mapTime = System.currentTimeMillis() - mapStart;
    // System.out.println(
    // "✅ [PostService] Mapping END: " + mapTime + "ms, Total: " +
    // (System.currentTimeMillis() - start) + "ms");

    return dtos;
  }

  public List<PostSummaryDto> getLikedPostsForUser(UUID userId) {
    var liked = likes.findByUserId(userId);
    var postIds = liked.stream().map(Like::getPostId).toList();
    if (postIds.isEmpty())
      return List.of();

    return posts.findByIdInAndStatusOrderByCreatedAtDesc(postIds, "active")
        .stream()
        .map(p -> {
          boolean isLiked = true;
          boolean isSaved = savedPosts.findByUserIdAndPostId(userId, p.getId()).isPresent();
          return PostMapper.toSummary(
              p,
              mediaRepo,
              postMediaRepository,
              isLiked,
              isSaved);
        })
        .toList();
  }

  public List<PostSummaryDto> getSavedPostsForUser(UUID userId) {
    var saved = savedPosts.findByUserId(userId);
    var postIds = saved.stream().map(SavedPost::getPostId).toList();
    if (postIds.isEmpty())
      return List.of();

    return posts.findByIdInAndStatusOrderByCreatedAtDesc(postIds, "active")
        .stream()
        .map(p -> {
          boolean isLiked = likes.findByUserIdAndPostId(userId, p.getId()).isPresent();
          boolean isSaved = true;
          return PostMapper.toSummary(
              p,
              mediaRepo,
              postMediaRepository,
              isLiked,
              isSaved);
        })
        .toList();
  }

  public void adminSetPostStatus(UUID postId, String status) {
    if (!"active".equalsIgnoreCase(status) && !"hidden".equalsIgnoreCase(status)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    }

    Post post = posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

    post.setStatus(status.toLowerCase());
    posts.save(post);
  }

}
