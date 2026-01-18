package blog.service;

import blog.dto.UserProfileDto;
import blog.mapper.UserProfileMapper;
import blog.models.Media;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.SubscriptionRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository users;
    private final MediaRepository mediaRepo;
    private final SubscriptionRepository subscriptions;
    private final UserProfileMapper userProfileMapper;
    private final CurrentUserService currentUserService;

    public UserProfileDto getProfileByUsername(String username, org.springframework.security.core.Authentication auth) {
        User target = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        User me = currentUserService.getCurrentUserOrNull(auth);
        boolean isSubscribed = me != null &&
                subscriptions.existsBySubscriberIdAndSubscribedToId(me.getId(), target.getId());

        return userProfileMapper.toProfileDto(target, isSubscribed);
    }

    public List<UserProfileDto> searchProfiles(String q, Authentication auth) {
        User me = currentUserService.getCurrentUserOrNull(auth);
        UUID meId = (me != null) ? me.getId() : null;

        return users.findByNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(q, q)
                .stream()
                .map(u -> {
                    boolean isSubscribed = meId != null &&
                            subscriptions.existsBySubscriberIdAndSubscribedToId(meId, u.getId());
                    return userProfileMapper.toProfileDto(u, isSubscribed);
                })
                .toList();
    }

    public Map<String, Object> getMe(org.springframework.security.core.Authentication auth) {
        User me = currentUserService.getCurrentUser(auth);

        String avatarUrl = null;
        if (me.getAvatarMediaId() != null) {
            avatarUrl = mediaRepo.findById(me.getAvatarMediaId()).map(Media::getUrl).orElse(null);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", me.getId());
        response.put("username", me.getUsername());
        response.put("name", me.getName());
        response.put("email", me.getEmail());
        response.put("bio", me.getBio());
        response.put("age", me.getAge());
        response.put("avatarUrl", avatarUrl);
        response.put("role", me.getRole().name());
        return response;
    }

    @Transactional
    public UserProfileDto updateProfileByUsername(String username, Map<String, Object> updates) {
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (updates.containsKey("name"))
            user.setName((String) updates.get("name"));
        if (updates.containsKey("email"))
            user.setEmail((String) updates.get("email"));
        if (updates.containsKey("bio"))
            user.setBio((String) updates.get("bio"));
        if (updates.containsKey("age")) {
            Integer age = (Integer) updates.get("age");
            if (age != null && age >= 15)
                user.setAge(age);
        }

        users.save(user);

        // if you want avatarUrl here later, let the mapper compute it
        return new UserProfileDto(
                user.getId(), user.getUsername(), user.getName(), user.getEmail(),
                user.getBio(), user.getAge(), null);
    }

    @Transactional
    public UserProfileDto updateMyProfile(Map<String, Object> updates,
            org.springframework.security.core.Authentication auth) {
        User me = currentUserService.getCurrentUser(auth);
        return updateProfileByUsername(me.getUsername(), updates);
    }
}
