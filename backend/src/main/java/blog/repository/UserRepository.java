package blog.repository;

import blog.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, UUID> {
  boolean existsByUsername(String username);
  boolean existsByEmail(String email);
  Optional<User> findByUsername(String username);
  Optional<User> findByEmail(String email);
  List<User> findByNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(String name, String username);
}
