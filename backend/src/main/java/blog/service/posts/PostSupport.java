package blog.service.posts;

import blog.models.Post;
import blog.models.User;
import blog.repository.PostRepository;
import blog.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class PostSupport {

  private final UserRepository users;
  private final PostRepository posts;

  public PostSupport(UserRepository users, PostRepository posts) {
    this.users = users;
    this.posts = posts;
  }

  public User requireUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  public Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }
}
