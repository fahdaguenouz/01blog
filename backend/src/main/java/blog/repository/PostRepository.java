package blog.repository;

import blog.models.Post;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
  Page<Post> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
  Page<Post> findByAuthorIdAndStatus(UUID userId, String status, Pageable pageable);
  List<Post> findByAuthorId(UUID userId);
}
