// src/main/java/blog/repository/PostRepository.java
package blog.repository;


import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import blog.models.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {

  @EntityGraph(attributePaths = {"author"})
  Page<Post> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

  @EntityGraph(attributePaths = {"author"})
  @Query("select p from Post p where p.author.id = :userId and p.status = :status order by p.createdAt desc")
  Page<Post> findByAuthorIdAndStatus(UUID userId, String status, Pageable pageable);
}
