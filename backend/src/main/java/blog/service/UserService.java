package blog.service;

import blog.dto.AuthResponse;
import blog.dto.LoginRequest;
import blog.dto.UserProfileDto;
import blog.models.User;
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



  public AuthResponse authenticate(LoginRequest request) {
    return authService.authenticate(request);
  }

  public void logout(String tokenHeader) {
    authService.logout(tokenHeader);
  }

  public User registerMultipart(String name, String username, String email, String password,
                                Integer age, String bio, MultipartFile avatar) {
    return registrationService.registerMultipart(name, username, email, password, age, bio, avatar);
  }

  public Optional<User> findByUsername(String username) {
    return registrationService != null ? Optional.empty() : Optional.empty(); // remove if not needed
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
