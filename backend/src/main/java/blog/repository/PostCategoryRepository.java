// src/main/java/blog/repository/PostCategoryRepository.java
package blog.repository;

import blog.models.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface PostCategoryRepository extends JpaRepository<PostCategory, UUID> {

  List<PostCategory> findByPostId(UUID postId);
 @Modifying
@Transactional
@Query("delete from PostCategory pc where pc.postId = :postId")
  void deleteByPostId(UUID postId);
}
