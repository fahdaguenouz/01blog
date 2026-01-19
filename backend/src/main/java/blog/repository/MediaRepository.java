package blog.repository;

import blog.models.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MediaRepository extends JpaRepository<Media, UUID> {
    void deleteByUserId(UUID userId);

    List<Media> findByUserId(UUID userId);

}
