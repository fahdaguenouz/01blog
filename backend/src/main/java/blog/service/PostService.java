package blog.service;

import blog.controller.PostController;
import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.mapper.PostMapper;
import blog.models.Comment;
import blog.models.Post;
import blog.models.User;
import blog.repository.CommentRepository;
import blog.repository.MediaRepository;
import blog.repository.PostRepository;
import blog.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PostService {

  private final PostRepository posts;
  private final UserRepository users;
  private final MediaRepository mediaRepo;
  private final CommentRepository comments;
  private final LocalMediaStorage mediaStorage;

 public PostService(PostRepository posts, UserRepository users, CommentRepository comments,
                     MediaRepository mediaRepo, LocalMediaStorage mediaStorage) {
    this.posts = posts;
    this.users = users;
    this.comments = comments;
    this.mediaRepo = mediaRepo;                  
    this.mediaStorage = mediaStorage;
  }

   public PostDetailDto createPost(String username, String title, String description, MultipartFile media) {
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
    return PostMapper.toDetail(post);
  }

  // ✅ Public posts for guests
public Page<PostSummaryDto> listPublic(String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByStatusOrderByCreatedAtDesc(status, pageable)
           .map(p -> PostMapper.toSummary(p, mediaRepo));  // Pass mediaRepo here
  }


  public Page<PostSummaryDto> listByAuthor(UUID userId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByAuthorIdAndStatus(userId, status, pageable)
           .map(p -> PostMapper.toSummary(p, mediaRepo));  // Pass mediaRepo here too
  }

 public PostDetailDto getOne(UUID id) {
    Post p = posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    return PostMapper.toDetail(p);
  }

  // ✅ FEED for logged-in users
   public List<PostSummaryDto> getFeedForUser(String username) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    return posts.findByStatusOrderByCreatedAtDesc("active", PageRequest.of(0, 20))
                .stream()
                .map(p -> PostMapper.toSummary(p, mediaRepo))  // Pass mediaRepo here
                .toList();
  }

  // ✅ Like post
 public void likePost(String username, UUID postId) {
    Post post = posts.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    post.setLikesCount(post.getLikesCount() + 1);
    posts.save(post);
  }

  // ✅ Unlike post
   public void unlikePost(String username, UUID postId) {
    Post post = posts.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
    posts.save(post);
  }

  public PostDetailDto updatePost(String username, UUID id, String title, String description, MultipartFile media) {
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
    return PostMapper.toDetail(post);
  }

  public void deletePost(String username, UUID id) {
    User user = users.findByUsername(username).orElseThrow(() -> new IllegalArgumentException("User not found"));
    Post post = posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    if (!post.getAuthor().getId().equals(user.getId())) {
      throw new IllegalArgumentException("Forbidden");
    }
    // Optionally delete media and comments cascade by FK
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
    comments.save(c);
    post.setCommentsCount((post.getCommentsCount() == null ? 0 : post.getCommentsCount()) + 1);
    posts.save(post);
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
}
