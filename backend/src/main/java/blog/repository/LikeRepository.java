package blog.repository;

import blog.models.Like;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LikeRepository extends JpaRepository<Like, UUID> {
  Optional<Like> findByUserIdAndPostId(UUID userId, UUID postId);
  int countByPostId(UUID postId);
  void deleteByUserIdAndPostId(UUID userId, UUID postId);
  void deleteByPostId(UUID postId);
}
