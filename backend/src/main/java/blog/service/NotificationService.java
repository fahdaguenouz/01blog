package blog.service;

import java.util.HashMap;
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

        if (target.getId().equals(actor.getId()))
            return;

        Map<String, Object> payload = new HashMap<>();
        payload.put("actorUsername", actor.getUsername());

        if (post != null) {
            payload.put("postId", post.getId());
        }

        Notification notif = new Notification();
        notif.setTargetUser(target);
        notif.setType(type);
        notif.setPost(post);
        notif.setPayload(payload);

        notificationRepo.save(notif);
        unseenRepo.save(new UnseenNotification(target, notif));
    }

}
