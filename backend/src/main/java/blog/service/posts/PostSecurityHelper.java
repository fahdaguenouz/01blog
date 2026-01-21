package blog.service.posts;

import blog.models.Post;
import blog.models.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Component
public class PostSecurityHelper {

  public void assertOwner(Post post, User user) {
    if (post.getAuthor() == null || !post.getAuthor().getId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
  }

  public void assertVisibleToUser(Post post, UUID currentUserId) {
    if ("hidden".equalsIgnoreCase(post.getStatus())) {
      boolean isOwner = currentUserId != null
          && post.getAuthor() != null
          && currentUserId.equals(post.getAuthor().getId());

      if (!isOwner) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found");
      }
    }
  }



}
