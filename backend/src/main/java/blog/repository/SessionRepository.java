package blog.repository;

import blog.models.Session;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface SessionRepository extends JpaRepository<Session, UUID> {
  Optional<Session> findByToken(String token);

  Optional<Session> findByUserId(UUID userId);

  @Modifying
  @Transactional
  @Query("delete from Session s where s.userId = :userId")
  void deleteByUserId(UUID userId);
}
