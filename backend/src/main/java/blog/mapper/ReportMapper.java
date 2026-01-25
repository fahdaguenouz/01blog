package blog.mapper;


import blog.dto.ReportDto;
import blog.models.Media;
import blog.models.Report;
import blog.models.User;
import blog.repository.MediaRepository;
import blog.repository.PostRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.time.ZoneOffset;

import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReportMapper {

  private final UserRepository users;
  private final MediaRepository mediaRepo;
  private final PostRepository posts;

  public ReportDto toDto(Report r) {
    User reporter = users.findById(r.getReporterId()).orElse(null);
    User reported = (r.getReportedUserId() != null) ? users.findById(r.getReportedUserId()).orElse(null) : null;

    String reporterAvatarUrl = avatarUrl(reporter);
    String reportedAvatarUrl = avatarUrl(reported);

    String postStatus = null;
    if (r.getReportedPostId() != null) {
      postStatus = posts.findById(r.getReportedPostId()).map(p -> p.getStatus()).orElse(null);
    }

    return new ReportDto(
        r.getId(),

        r.getReporterId(),
        reporter != null ? reporter.getUsername() : "unknown",
        reporterAvatarUrl,

        r.getReportedUserId(),
        reported != null ? reported.getUsername() : "unknown",
        reportedAvatarUrl,

        r.getReportedPostId(),
        r.getReportedCommentId(),

        r.getCategory(),
        r.getReason(),
        r.getStatus(),
        r.getCreatedAt().atZone(ZoneOffset.UTC).toInstant(),
        postStatus
    );
  }

  private String avatarUrl(User u) {
    if (u == null || u.getAvatarMediaId() == null) return null;
    return mediaRepo.findById(u.getAvatarMediaId()).map(Media::getUrl).orElse(null);
  }
}
