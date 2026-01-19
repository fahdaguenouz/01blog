package blog.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;

import blog.enums.NotificationType;
import blog.models.Notification;
import blog.models.Post;
import blog.models.UnseenNotification;
import blog.models.User;
import blog.repository.NotificationRepository;
import blog.repository.UnseenNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;


@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepo;

    @Autowired
    private UnseenNotificationRepository unseenRepo;

    public void notify(User target, User actor, NotificationType type, Post post, UUID commentId) {

        if (target.getId().equals(actor.getId()))
            return;

        // ✅ dedup rules: which types should never duplicate?
        boolean dedup = type == NotificationType.POST_LIKED ||
                type == NotificationType.POST_SAVED ||
                type == NotificationType.USER_FOLLOWED ||
                type == NotificationType.FOLLOWING_POSTED;

        if (dedup) {
            var actorId = actor.getId().toString();

            var existing = (post != null)
                    ? notificationRepo.findExistingWithPost(target.getId(), type.name(), post.getId(), actorId)
                    : notificationRepo.findExistingNoPost(target.getId(), type.name(), actorId);

            if (existing.isPresent()) {
                Notification n = existing.get();

                // bump to top
                n.setCreatedAt(Instant.now());
                notificationRepo.save(n);

                // mark unseen again
                unseenRepo.deleteByNotification_IdAndUser_Id(n.getId(), target.getId());
                unseenRepo.save(new UnseenNotification(target, n));
                return;
            }
        }

        // create new notification
        Map<String, Object> payload = new HashMap<>();
        payload.put("actorUsername", actor.getUsername());
        payload.put("actorId", actor.getId().toString());

        if (post != null)
            payload.put("postId", post.getId().toString());
        if (commentId != null)
            payload.put("commentId", commentId.toString());
        Notification notif = new Notification();
        notif.setTargetUser(target);
        notif.setType(type);
        notif.setPost(post);
        notif.setPayload(payload);
        notif.setCreatedAt(Instant.now());

        notificationRepo.save(notif);
        unseenRepo.save(new UnseenNotification(target, notif));
    }

    @Transactional
    public void deleteCommentNotification(UUID postId, UUID commentId) {
        String cid = commentId.toString();
        notificationRepo.deleteUnseenByComment(NotificationType.POST_COMMENTED.name(), postId, cid);
        notificationRepo.deleteNotificationsByComment(NotificationType.POST_COMMENTED.name(), postId, cid);
    }

}
