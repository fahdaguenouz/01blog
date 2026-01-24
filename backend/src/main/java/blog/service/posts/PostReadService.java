package blog.service.posts;

import blog.dto.PostDetailDto;
import blog.models.Like;
import blog.models.Post;
import blog.models.SavedPost;
import blog.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PostReadService {

  private final PostRepository posts;
  private final LikeRepository likes;
  private final SavedPostRepository savedPosts;
  private final PostSecurityHelper security;
  private final PostAssembler assembler;



  private Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  public PostDetailDto getOne(UUID id, UUID currentUserId) {
    Post post = requirePost(id);
    security.assertVisibleToUser(post, currentUserId);
    return assembler.toDetail(post, currentUserId);
  }

  public List<PostDetailDto> getPostsByAuthor(UUID userId) {
    List<Post> result = posts.findByAuthorIdAndStatusOrderByCreatedAtDesc(userId, "active");
    return result.stream().map(p -> assembler.toDetail(p, false, false)).toList();
  }

  public List<PostDetailDto> getLikedPostsForUser(UUID userId) {
    var liked = likes.findByUserId(userId);
    var postIds = liked.stream().map(Like::getPostId).toList();
    if (postIds.isEmpty()) return List.of();

    return posts.findByIdInAndStatusOrderByCreatedAtDesc(postIds, "active")
        .stream()
        .map(p -> {
          boolean isSaved = savedPosts.findByUserIdAndPostId(userId, p.getId()).isPresent();
          return assembler.toDetail(p, true, isSaved);
        })
        .toList();
  }

  public List<PostDetailDto> getSavedPostsForUser(UUID userId) {
    var saved = savedPosts.findByUserId(userId);
    var postIds = saved.stream().map(SavedPost::getPostId).toList();
    if (postIds.isEmpty()) return List.of();

    return posts.findByIdInAndStatusOrderByCreatedAtDesc(postIds, "active")
        .stream()
        .map(p -> {
          boolean isLiked = likes.findByUserIdAndPostId(userId, p.getId()).isPresent();
          return assembler.toDetail(p, isLiked, true);
        })
        .toList();
  }
}
