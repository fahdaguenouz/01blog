package blog.service;

import java.util.Map;

import blog.enums.NotificationType;
import blog.models.Notification;
import blog.models.Post;
import blog.models.UnseenNotification;
import blog.models.User;
import blog.repository.NotificationRepository;
import blog.repository.UnseenNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepo;

    @Autowired
    private UnseenNotificationRepository unseenRepo;

    @Autowired
    private ObjectMapper mapper;

    public void notify(User target, User actor, NotificationType type, Post post) {
        // Don't notify yourself
        if (target.getId().equals(actor.getId()))
            return;

        // Build payload
        Map<String, Object> payload = Map.of(
                "actorUsername", actor.getUsername(),
                "postId", post != null ? post.getId() : null);

        // Create notification
        Notification notif = new Notification();
        notif.setTargetUser(target);
        notif.setType(type);
        notif.setPost(post);
        notif.setPayload(payload); // ✅ Map stored directly as jsonb

        // Save notification
        notificationRepo.save(notif);

        // Save unseen notification for quick access
        unseenRepo.save(new UnseenNotification(target, notif));
    }

}
