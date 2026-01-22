package blog.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import blog.enums.NotificationType;
import blog.models.Notification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;


public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  @Query("""
        select n from Notification n
        where n.targetUser.id = :userId
        order by n.createdAt desc
      """)
  List<Notification> findByUser(@Param("userId") UUID userId);

  @Query(value = """
        select * from notifications n
        where n.user_id = :targetId
          and n.type = :type
          and n.post_id = :postId
          and (n.payload->>'actorId') = :actorId
        order by n.created_at desc
        limit 1
      """, nativeQuery = true)
  Optional<Notification> findExistingWithPost(
      @Param("targetId") UUID targetId,
      @Param("type") String type,
      @Param("postId") UUID postId,
      @Param("actorId") String actorId);

  // ✅ types WITHOUT post (USER_FOLLOWED)
  @Query(value = """
        select * from notifications n
        where n.user_id = :targetId
          and n.type = :type
          and n.post_id is null
          and (n.payload->>'actorId') = :actorId
        order by n.created_at desc
        limit 1
      """, nativeQuery = true)
  Optional<Notification> findExistingNoPost(
      @Param("targetId") UUID targetId,
      @Param("type") String type,
      @Param("actorId") String actorId);

  @Modifying
  @Query(value = """
        delete from notifications n
        where n.type = :type
          and n.post_id = :postId
          and (n.payload->>'commentId') = :commentId
      """, nativeQuery = true)
  void deleteNotificationsByComment(@Param("type") String type,
      @Param("postId") UUID postId,
      @Param("commentId") String commentId);

  @Modifying
  @Query(value = """
        delete from unseen_notifications un
        using notifications n
        where un.notification_id = n.id
          and n.type = :type
          and n.post_id = :postId
          and (n.payload->>'commentId') = :commentId
      """, nativeQuery = true)
  void deleteUnseenByComment(@Param("type") String type,
      @Param("postId") UUID postId,
      @Param("commentId") String commentId);
}
