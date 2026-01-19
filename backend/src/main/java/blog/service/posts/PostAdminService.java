package blog.service.posts;

import blog.models.Post;
import blog.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PostAdminService {

  private final PostRepository posts;

  private Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  public void adminSetPostStatus(UUID postId, String status) {
    if (status == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
    }

    if (!"active".equalsIgnoreCase(status) && !"hidden".equalsIgnoreCase(status)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    }

    Post post = requirePost(postId);
    post.setStatus(status.toLowerCase());
    posts.save(post);
  }
}
