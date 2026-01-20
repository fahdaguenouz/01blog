package blog.service.users;

import blog.dto.AuthResponse;
import blog.dto.LoginRequest;
import blog.dto.UserProfileDto;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
import blog.service.AuthService;
import blog.service.AvatarService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final AuthService authService;
  private final UserRegistrationService registrationService;
  private final UserProfileService userProfileService;
  private final AvatarService avatarService;
  private final CurrentUserService currentUserService;
  private final UserRepository users;
  private final MediaRepository mediaRepo;

  public AuthResponse authenticate(LoginRequest request) {
    return authService.authenticate(request);
  }

  public void logout(String tokenHeader) {
    authService.logout(tokenHeader);
  }

  public void registerMultipart(String name, String username, String email, String password,
      Integer age, String bio, MultipartFile avatar) {
    registrationService.registerMultipart(name, username, email, password, age, bio, avatar);
  }

  public Optional<User> findByUsername(String username) {
   return users.findByUsername(username);
  }

  public UserProfileDto getProfileByUsername(String username, Authentication auth) {
    return userProfileService.getProfileByUsername(username, auth);
  }

  public List<UserProfileDto> searchProfiles(String q, Authentication auth) {
    return userProfileService.searchProfiles(q, auth);
  }

  public Map<String, Object> getMe(Authentication auth) {
    return userProfileService.getMe(auth);
  }

  public UserProfileDto updateMyProfile(Map<String, Object> updates, Authentication auth) {
    return userProfileService.updateMyProfile(updates, auth);
  }

  public void updateMyAvatar(MultipartFile avatar, Authentication auth) {
    var me = currentUserService.getCurrentUser(auth);
    avatarService.updateAvatar(me.getUsername(), avatar);
  }

  public User getCurrentUser(Authentication auth) {
    return currentUserService.getCurrentUser(auth);
  }

  public void assertAdmin(Authentication auth) {
    currentUserService.assertAdmin(auth);
  }
}
