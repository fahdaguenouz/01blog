package blog.service.posts;

import blog.enums.NotificationType;
import blog.models.Post;
import blog.models.SavedPost;
import blog.models.User;
import blog.repository.PostRepository;
import blog.repository.SavedPostRepository;
import blog.repository.UserRepository;
import blog.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PostSaveService {

  private final UserRepository users;
  private final PostRepository posts;
  private final SavedPostRepository savedPosts;
  private final NotificationService notificationService;

  public PostSaveService(
      UserRepository users,
      PostRepository posts,
      SavedPostRepository savedPosts,
      NotificationService notificationService
  ) {
    this.users = users;
    this.posts = posts;
    this.savedPosts = savedPosts;
    this.notificationService = notificationService;
  }

  private User requireUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  public void savePost(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);
      if ("hidden".equalsIgnoreCase(post.getStatus())) {
      throw new ResponseStatusException(HttpStatus.GONE, "Post is hidden");
    }
    Optional<SavedPost> existing = savedPosts.findByUserIdAndPostId(user.getId(), postId);
    if (existing.isPresent()) return;

    SavedPost savedPost = new SavedPost();
    savedPost.setUserId(user.getId());
    savedPost.setPostId(postId);
    savedPosts.save(savedPost);

    notificationService.notify(post.getAuthor(), user, NotificationType.POST_SAVED, post,null);
  }

  public void unsavePost(String username, UUID postId) {
    User user = requireUser(username);
    savedPosts.findByUserIdAndPostId(user.getId(), postId).ifPresent(savedPosts::delete);
  }
}
