package blog.repository;

import java.util.UUID;
import blog.models.UnseenNotification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 import java.util.Optional;
@Repository
public interface UnseenNotificationRepository
        extends JpaRepository<UnseenNotification, UUID> {

    boolean existsByNotification_Id(UUID notificationId);

    void deleteByNotification_Id(UUID notificationId);

    void deleteByNotification_IdAndUser_Id(UUID notificationId, UUID userId);

    Optional<UnseenNotification> findByNotification_IdAndUser_Id(UUID notificationId, UUID userId);

}


