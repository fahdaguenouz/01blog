// src/main/java/blog/repository/CommentRepository.java
package blog.repository;

import blog.models.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
  List<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId);
   void deleteByPostId(UUID postId);
}
