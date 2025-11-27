package blog.repository;

import blog.models.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    boolean existsBySubscriberIdAndSubscribedToId(UUID subscriberId, UUID subscribedToId);
    
    long countBySubscribedToId(UUID subscribedToId);
    long countBySubscriberId(UUID subscriberId);
    
    @Modifying
    @Query("DELETE FROM Subscription s WHERE s.subscriberId = :subscriberId AND s.subscribedToId = :subscribedToId")
    void deleteBySubscriberIdAndSubscribedToId(UUID subscriberId, UUID subscribedToId);
}
