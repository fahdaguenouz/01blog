package blog.service;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.mapper.PostMapper;
import blog.models.Post;
import blog.models.User;
import blog.repository.PostRepository;
import blog.repository.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class PostService {

  private final PostRepository posts;
  private final UserRepository users;

  public PostService(PostRepository posts, UserRepository users) {
    this.posts = posts;
    this.users = users;
  }

  // ✅ Public posts for guests
  public Page<PostSummaryDto> listPublic(String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(PostMapper::toSummary);
  }

  public Page<PostSummaryDto> listByAuthor(UUID userId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByAuthorIdAndStatus(userId, status, pageable)
                .map(PostMapper::toSummary);
  }

  public PostDetailDto getOne(UUID id) {
    Post p = posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    return PostMapper.toDetail(p);
  }

  // ✅ FEED for logged-in users
  public List<PostSummaryDto> getFeedForUser(String username) {
    User user = users.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));
    // For now, return all posts (you can later filter by followed users, etc.)
    return posts.findByStatusOrderByCreatedAtDesc("active", PageRequest.of(0, 20))
        .stream()
        .map(PostMapper::toSummary)
        .toList();
  }

  // ✅ Create a new post
  public PostDetailDto createPost(String username, String title, String description, MultipartFile media) {
    User user = users.findByUsername(username)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    Post post = new Post();
    post.setAuthor(user);
    post.setTitle(title);
    post.setBody(description);
    post.setStatus("active");

    // optional: save media handling later
    posts.save(post);
    return PostMapper.toDetail(post);
  }

  // ✅ Like post
  public void likePost(String username, UUID postId) {
    Post post = posts.findById(postId)
        .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    post.setLikesCount(post.getLikesCount() + 1);
    posts.save(post);
  }

  // ✅ Unlike post
  public void unlikePost(String username, UUID postId) {
    Post post = posts.findById(postId)
        .orElseThrow(() -> new IllegalArgumentException("Post not found"));
    post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
    posts.save(post);
  }
}
