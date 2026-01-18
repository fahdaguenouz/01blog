package blog.service;

import blog.dto.UserProfileDto;
import blog.enums.NotificationType;
import blog.mapper.UserProfileMapper;
import blog.models.Subscription;
import blog.models.User;
import blog.repository.SubscriptionRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.NoSuchElementException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

  private final UserRepository users;
  private final SubscriptionRepository subscriptions;
  private final NotificationService notificationService;
  private final UserProfileMapper userProfileMapper; // we'll create this below

  @Transactional
  public UserProfileDto subscribe(UUID targetUserId, User me) {
    if (me.getId().equals(targetUserId)) {
      throw new IllegalArgumentException("Cannot follow yourself");
    }

    if (subscriptions.existsBySubscriberIdAndSubscribedToId(me.getId(), targetUserId)) {
      throw new IllegalArgumentException("Already following this user");
    }

    User target = users.findById(targetUserId)
        .orElseThrow(() -> new NoSuchElementException("Target user not found"));

    Subscription s = Subscription.builder()
        .subscriberId(me.getId())
        .subscribedToId(targetUserId)
        .createdAt(OffsetDateTime.now())
        .build();

    subscriptions.save(s);

    notificationService.notify(target, me, NotificationType.USER_FOLLOWED, null);

return userProfileMapper.toProfileDto(target, true);
  }

  @Transactional
  public UserProfileDto unsubscribe(UUID targetUserId, User me) {
    User target = users.findById(targetUserId)
        .orElseThrow(() -> new NoSuchElementException("Target user not found"));

    subscriptions.deleteBySubscriberIdAndSubscribedToId(me.getId(), targetUserId);

return userProfileMapper.toProfileDto(target, false);
  }

  public List<UserProfileDto> followers(UUID userId, UUID meId) {
    var followerIds = subscriptions.findSubscriberIdsBySubscribedToId(userId);
    if (followerIds.isEmpty()) return List.of();

    var followerUsers = users.findAllById(followerIds);

    return followerUsers.stream()
        .map(u -> userProfileMapper.toProfileDto(
            u,
            subscriptions.existsBySubscriberIdAndSubscribedToId(meId, u.getId())
        ))
        .toList();
  }

  public List<UserProfileDto> following(UUID userId, UUID meId) {
    var followingIds = subscriptions.findSubscribedToIdsBySubscriberId(userId);
    if (followingIds.isEmpty()) return List.of();

    var followingUsers = users.findAllById(followingIds);

    return followingUsers.stream()
        .map(u -> userProfileMapper.toProfileDto(
            u,
            subscriptions.existsBySubscriberIdAndSubscribedToId(meId, u.getId())
        ))
        .toList();
  }
}
