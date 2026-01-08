package blog.repository;

import blog.models.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PostMediaRepository extends JpaRepository<PostMedia, UUID> {
    List<PostMedia> findByPostIdOrderByPositionAsc(UUID postId);
    void deleteByPostId(UUID postId);
}
