package blog.service;

import blog.controller.PostController;
import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.mapper.PostMapper;
import blog.models.Comment;
import blog.models.Like;
import blog.models.Post;
import blog.models.User;
import blog.dto.CategoryDto;
import blog.models.PostCategory;
import blog.models.SavedPost;
import blog.repository.CategoryRepository;
import blog.repository.PostCategoryRepository;
import java.util.*;

import blog.repository.CommentRepository;
import blog.repository.LikeRepository;
import blog.repository.MediaRepository;
import blog.repository.PostRepository;
import blog.repository.SavedPostRepository;
import blog.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
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

  public PostService(PostRepository posts, UserRepository users, CommentRepository comments,
      MediaRepository mediaRepo, LikeRepository likes,
      LocalMediaStorage mediaStorage,
      CategoryRepository categories,
      PostCategoryRepository postCategories,
      SavedPostRepository savedPosts) {
    this.posts = posts;
    this.users = users;
    this.comments = comments;
    this.mediaRepo = mediaRepo;
    this.mediaStorage = mediaStorage;
    this.likes = likes;
    this.categories = categories;
    this.postCategories = postCategories;
    this.savedPosts = savedPosts;
  }

  public PostDetailDto createPost(String username, String title, String description, MultipartFile media,
      List<UUID> categoryIds) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));

    Post post = new Post();
    post.setAuthor(user);
    post.setTitle(title);
    post.setBody(description);
    post.setStatus("active");

    if (media != null && !media.isEmpty()) {
      var saved = mediaStorage.save(media);
      if (saved != null) {
        post.setMediaUrl(saved.url());
        String mt = saved.contentType();
        post.setMediaType(mt != null && mt.startsWith("video") ? "video" : "image");
      }
    }

    posts.save(post);
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
    return PostMapper.toDetail(post, categoryDtos, false, false);
  }

  // ✅ Public posts for guests
  public Page<PostSummaryDto> listPublic(String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByStatusOrderByCreatedAtDesc(status, pageable)
        .map(p -> PostMapper.toSummary(p, mediaRepo, false, false)); // Pass mediaRepo here
  }

  public Page<PostSummaryDto> listByAuthor(UUID userId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByAuthorIdAndStatus(userId, status, pageable)
         .map(p -> PostMapper.toSummary(p, mediaRepo, false, false)); // Pass mediaRepo here too
  }

public PostDetailDto getOne(UUID id, UUID currentUserId) {
  Post p = posts.findById(id)
      .orElseThrow(() -> new IllegalArgumentException("Post not found"));

  List<CategoryDto> categoryDtos = postCategories.findByPostId(p.getId()).stream()
      .map(pc -> categories.findById(pc.getCategoryId())
          .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
          .orElse(null))
      .filter(Objects::nonNull)
      .toList();

  boolean isLiked = currentUserId != null && likes.findByUserIdAndPostId(currentUserId, id).isPresent();
  boolean isSaved = currentUserId != null && savedPosts.findByUserIdAndPostId(currentUserId, id).isPresent();

  return PostMapper.toDetail(p, categoryDtos, isLiked, isSaved);
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
    comparator = Comparator.comparing(Post::getCreatedAt).reversed();
    break;
}

  base.sort(comparator);

  return base.stream()
      .map(p -> {
        boolean isLiked = likes.findByUserIdAndPostId(userId, p.getId()).isPresent();
        boolean isSaved = savedPosts.findByUserIdAndPostId(userId, p.getId()).isPresent();
        return PostMapper.toSummary(p, mediaRepo, isLiked, isSaved);
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

  public PostDetailDto updatePost(String username,
      UUID id,
      String title,
      String description,
      MultipartFile media,
      List<UUID> categoryIds) {
    // System.out.println("=== updatePost ===");
    // System.out.println("username = " + username);
    // System.out.println("postId = " + id);
    // System.out.println("title = " + title);
    // System.out.println("descr = " + description);
    // System.out.println("media = " + (media != null ? media.getOriginalFilename()
    // : "null"));
    // System.out.println("categoryIds = " + categoryIds);
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Post post = posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    if (!post.getAuthor().getId().equals(user.getId()))
      throw new IllegalArgumentException("Forbidden");

    post.setTitle(title);
    post.setBody(description);

    if (media != null && !media.isEmpty()) {
      var saved = mediaStorage.save(media); // SavedFile
      if (saved != null) {
        post.setMediaUrl(saved.url());
        String mt = saved.contentType();
        post.setMediaType(mt != null && mt.startsWith("video") ? "video" : "image");
      }
    }

    posts.save(post);
    // System.out.println("before deleteByPostId");
    postCategories.deleteByPostId(post.getId());
    // System.out.println("after deleteByPostId");

    if (categoryIds != null) {
      categoryIds.stream().distinct().forEach(cid -> {
        if (!categories.existsById(cid))
          return;
        PostCategory pc = new PostCategory();
        pc.setPostId(post.getId());
        pc.setCategoryId(cid);
        postCategories.save(pc);
      });
    }

    List<CategoryDto> categoryDtos = postCategories.findByPostId(post.getId()).stream()
        .map(pc -> categories.findById(pc.getCategoryId())
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
            .orElse(null))
        .filter(Objects::nonNull)
        .toList();
    return PostMapper.toDetail(post, categoryDtos,false ,false);
  }

  @Transactional
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
  }

  public List<PostController.CommentDto> getComments(UUID postId) {
    return comments.findByPostIdOrderByCreatedAtDesc(postId).stream()
        .map(c -> new PostController.CommentDto(
            c.getId(), c.getPostId(), users.findById(c.getUserId()).map(User::getUsername).orElse("user"),
            c.getText(), c.getCreatedAt().toString()))
        .toList();
  }

  public void deleteComment(String username, UUID postId, UUID commentId) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Comment c = comments.findById(commentId).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
    if (!c.getUserId().equals(user.getId())) {
      throw new IllegalArgumentException("Forbidden");
    }
    comments.delete(c);
    // Optionally decrement post.comments_count
  }
public void savePost(String username, UUID postId) {
  User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
  // prevent duplicates
  Optional<SavedPost> existing = savedPosts.findByUserIdAndPostId(user.getId(), postId);
  if (existing.isPresent()) return;

  SavedPost savedPost = new SavedPost();
  savedPost.setUserId(user.getId());
  savedPost.setPostId(postId);
  savedPosts.save(savedPost);
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
    return posts.findByAuthorIdAndStatusOrderByCreatedAtDesc(userId, "active")
        .stream()
        .map(p -> PostMapper.toSummary(p, mediaRepo, false, false))
        .toList();
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
          return PostMapper.toSummary(p, mediaRepo, isLiked, isSaved);
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
          return PostMapper.toSummary(p, mediaRepo, isLiked, isSaved);
        })
        .toList();
  }

}
