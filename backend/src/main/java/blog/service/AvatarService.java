package blog.service;

import blog.models.Media;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AvatarService {

  private final UserRepository users;
  private final LocalMediaStorage storage;
  private final MediaRepository mediaRepo;

  @Transactional
  public void updateAvatar(String username, MultipartFile avatar) {
    User user = users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    var saved = storage.save(avatar);

    Media media = Media.builder()
        .userId(user.getId())
        .mediaType(saved.contentType() != null ? saved.contentType() : "image/*")
        .size(saved.size() != null ? saved.size() : 0)
        .url(saved.url())
        .uploadedAt(OffsetDateTime.now())
        .build();

    media = mediaRepo.save(media);

    user.setAvatarMediaId(media.getId());
    users.save(user);
  }
}
