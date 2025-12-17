package blog.repository;

import blog.models.Post;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
  Page<Post> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

  Page<Post> findByAuthorIdAndStatus(UUID userId, String status, Pageable pageable);

  List<Post> findByAuthorId(UUID userId);

  // PostRepository
  List<Post> findByStatus(String status);

  List<Post> findByAuthorIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);

  List<Post> findByIdInAndStatusOrderByCreatedAtDesc(List<UUID> ids, String status);
@Query("""
  SELECT p FROM Post p
  JOIN PostCategory pc ON pc.postId = p.id
  WHERE pc.categoryId = :categoryId AND p.status = :status
  ORDER BY p.createdAt DESC
""")
List<Post> findByCategoryAndStatus(@Param("categoryId") UUID categoryId, @Param("status") String status);

  @Modifying
  @Transactional
  @Query("delete from PostCategory pc where pc.postId = :postId")
  void deleteByPostId(UUID postId);
}
