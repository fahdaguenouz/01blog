package blog.service.admin;

import blog.models.Media;
import blog.repository.MediaRepository;
import blog.repository.UserRepository;
import blog.service.LocalMediaStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserModerationService {

    private final UserRepository userRepo;
  private final MediaRepository mediaRepo;
  private final LocalMediaStorage storage;

  @Transactional
  public void deleteUserAndAllContent(UUID userId) {
    if (!userRepo.existsById(userId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
    }

    // 1) delete files from disk
    List<Media> medias = mediaRepo.findByUserId(userId);
    for (Media m : medias) {
      storage.deleteByUrl(m.getUrl());
    }

    // 2) delete media rows
    mediaRepo.deleteByUserId(userId);

    // 3) delete user (and other content should be cascade / handled elsewhere)
    userRepo.deleteById(userId);
  }
}
