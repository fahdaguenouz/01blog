package blog.repository;

import blog.models.SavedPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedPostRepository extends JpaRepository<SavedPost, UUID> {
  List<SavedPost> findByUserId(UUID userId);
  Optional<SavedPost> findByUserIdAndPostId(UUID userId, UUID postId);
  void deleteByUserIdAndPostId(UUID userId, UUID postId);
  int countByPostId(UUID postId);
  @Transactional
  void deleteByPostId(UUID postId); 

}
