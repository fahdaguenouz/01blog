package blog.repository;

import blog.models.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
  List<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId);
  @Transactional
   void deleteByPostId(UUID postId);
}
