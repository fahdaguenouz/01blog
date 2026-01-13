// src/main/java/blog/repository/SessionRepository.java
package blog.repository;

import blog.models.Session;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, UUID> {
  Optional<Session> findByToken(String token);
  Optional<Session> findByUserId(UUID userId);
  void deleteByUserId(UUID userId);
}
