package blog.controller;

import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import blog.dto.NotificationDto;
import blog.repository.NotificationRepository;
import blog.repository.UnseenNotificationRepository;
import blog.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;

import blog.models.Notification;
import blog.models.UnseenNotification;
import blog.models.User;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepo;
    private final UnseenNotificationRepository unseenRepo;
    private final UserRepository users;

    @GetMapping
    public List<NotificationDto> getMyNotifications(
            Authentication auth) {
        User me = users.findByUsername(auth.getName())
                .orElseThrow();

        return notificationRepo.findByUser(me.getId())
                .stream()
                .<NotificationDto>map(n -> {
                 boolean seen = !unseenRepo.existsByNotification_Id(n.getId());


                    String actorUsername = null;
                    if (n.getPayload() != null) {
                        Object usernameObj = n.getPayload().get("actorUsername");
                        if (usernameObj != null) {
                            actorUsername = usernameObj.toString();
                        }
                    }

                    return new NotificationDto(
                            n.getId(),
                            n.getType(),
                            actorUsername,
                            n.getPost() != null ? n.getPost().getId() : null,
                           n.getCreatedAt().atZone(ZoneOffset.UTC).toInstant(),
                            seen);
                })
                .toList();
    }

@PostMapping("/{id}/seen")
public void markSeen(@PathVariable UUID id, Authentication auth) {
    if (auth == null || auth.getName() == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }

    User me = users.findByUsername(auth.getName())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    UnseenNotification unseen = unseenRepo.findByNotification_IdAndUser_Id(id, me.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found or already seen"));

    unseenRepo.delete(unseen);
}


@PostMapping("/{id}/unseen")
public void markUnseen(@PathVariable UUID id, Authentication auth) {
  if (auth == null || auth.getName() == null) {
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
  }

  User me = users.findByUsername(auth.getName())
    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

  // Check if notification exists for user
  Notification notif = notificationRepo.findById(id)
    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

  if (!notif.getTargetUser().getId().equals(me.getId())) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your notification");
  }

  // Delete existing unseen if any, then create new
  unseenRepo.deleteByNotification_IdAndUser_Id(id, me.getId());
  unseenRepo.save(new UnseenNotification(me, notif));
}



}
