package blog.mapper;

import blog.dto.UserProfileDto;
import blog.models.Media;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class UserProfileMapper {

  private final MediaRepository mediaRepo;
  private final SubscriptionRepository subscriptions;

  public UserProfileDto toProfileDto(User user, boolean isSubscribed) {
    String avatarUrl = null;
    if (user.getAvatarMediaId() != null) {
      avatarUrl = mediaRepo.findById(user.getAvatarMediaId()).map(Media::getUrl).orElse(null);
    }

    int followers = (int) subscriptions.countBySubscribedToId(user.getId());
    int following = (int) subscriptions.countBySubscriberId(user.getId());

    return new UserProfileDto(
        user.getId(),
        user.getUsername(),
        user.getName(),
        user.getEmail(),
        user.getBio(),
        user.getAge(),
        avatarUrl,
        followers,
        following,
        isSubscribed
    );
  }
}
