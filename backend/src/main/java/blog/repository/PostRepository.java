package blog.repository;

import blog.models.Post;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
  Page<Post> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

  Page<Post> findByAuthorIdAndStatus(UUID userId, String status, Pageable pageable);

  List<Post> findByAuthorId(UUID userId);

  List<Post> findByAuthorIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);

  List<Post> findByIdInAndStatusOrderByCreatedAtDesc(List<UUID> ids, String status);

  @Modifying
  @Query("delete from PostCategory pc where pc.postId = :postId")
  void deleteByPostId(UUID postId);
}
