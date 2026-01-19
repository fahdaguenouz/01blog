package blog.service.posts;

import blog.dto.PostDetailDto;
import blog.models.Post;
import blog.models.User;
import blog.repository.PostRepository;
import blog.repository.SavedPostRepository;
import blog.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PostFeedService {

  private final PostRepository posts;
  private final UserRepository users;
  private final SavedPostRepository savedPosts;
  private final PostAssembler assembler;

  public PostFeedService(PostRepository posts, UserRepository users, SavedPostRepository savedPosts, PostAssembler assembler) {
    this.posts = posts;
    this.users = users;
    this.savedPosts = savedPosts;
    this.assembler = assembler;
  }

  private User requireUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  public List<PostDetailDto> getFeedForUser(String username, UUID categoryId, String sort) {
    User user = requireUser(username);
    UUID userId = user.getId();

    List<Post> base = (categoryId != null)
        ? posts.findByCategoryAndStatus(categoryId, "active")
        : posts.findByStatus("active");

    Comparator<Post> comparator = switch (sort) {
      case "likes" -> Comparator.comparing(p -> Optional.ofNullable(p.getLikesCount()).orElse(0), Comparator.reverseOrder());
      case "saved" -> Comparator.comparing(p -> savedPosts.countByPostId(p.getId()), Comparator.reverseOrder());
      case "new" -> Comparator.comparing(Post::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
      default -> Comparator.comparing(Post::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    };

    base.sort(comparator);

    return base.stream().map(p -> assembler.toDetail(p, userId)).toList();
  }
}
