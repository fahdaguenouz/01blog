package blog.dto;

import java.time.Instant;
import java.util.UUID;

import blog.enums.NotificationType;


public record NotificationDto(
    UUID id,
    NotificationType type,
    String actorUsername,
    UUID postId,
    Instant createdAt,
    boolean seen
) {}