package blog.service.posts;

import blog.dto.PostDetailDto;
import blog.enums.NotificationType;
import blog.models.Like;
import blog.models.Post;
import blog.models.User;
import blog.repository.LikeRepository;
import blog.repository.PostRepository;
import blog.repository.UserRepository;
import blog.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PostLikeService {

  private final PostRepository posts;
  private final UserRepository users;
  private final LikeRepository likes;
  private final NotificationService notificationService;
  private final PostAssembler assembler;



  private User requireUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  public void likePost(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);
    if ("hidden".equalsIgnoreCase(post.getStatus())) {
      throw new ResponseStatusException(HttpStatus.GONE, "Post is hidden");
    }
    if (likes.findByUserIdAndPostId(user.getId(), postId).isPresent())
      return;

    Like like = new Like();
    like.setUserId(user.getId());
    like.setPostId(postId);
    likes.save(like);

    int newCount = likes.countByPostId(postId);
    post.setLikesCount(Math.max(newCount, 0));
    posts.saveAndFlush(post);

    notificationService.notify(post.getAuthor(), user, NotificationType.POST_LIKED, post, null);
  }

  public void unlikePost(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);
    if ("hidden".equalsIgnoreCase(post.getStatus())) {
      throw new ResponseStatusException(HttpStatus.GONE, "Post is hidden");
    }
    likes.findByUserIdAndPostId(user.getId(), postId).ifPresent(like -> {
      likes.delete(like);

      int newCount = likes.countByPostId(postId);
      post.setLikesCount(Math.max(newCount, 0));
      posts.saveAndFlush(post);
    });
  }

  public PostDetailDto likeAndReturn(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);

    likePost(username, postId);

    return assembler.toDetail(post, user.getId());
  }

  public PostDetailDto unlikeAndReturn(String username, UUID postId) {
    User user = requireUser(username);
    unlikePost(username, postId);
    Post post = requirePost(postId);
    return assembler.toDetail(post, user.getId());
  }
}
