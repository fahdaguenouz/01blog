package blog.repository;

import java.util.List;
import java.util.UUID;

import blog.models.Notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;


@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("""
      select n from Notification n
      where n.targetUser.id = :userId
      order by n.createdAt desc
    """)
    List<Notification> findByUser(UUID userId);
}
