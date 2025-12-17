// src/main/java/blog/service/ReportService.java
package blog.service;

import blog.dto.CreateReportRequest;
import blog.dto.ReportDto;
import blog.models.Report;
import blog.models.User;
import blog.repository.PostRepository;
import blog.repository.ReportRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {
  private final ReportRepository repo;
  private final UserRepository userRepo;
  private final PostRepository postRepo;

  private final JdbcTemplate jdbc;

  public ReportDto createReport(UUID reporterId, CreateReportRequest req) {
    Report r = new Report();
    r.setReporterId(reporterId);
    r.setReportedUserId(req.reportedUserId());
    r.setReportedPostId(req.reportedPostId());
    r.setReportedCommentId(req.reportedCommentId());
    r.setCategory(req.category());
    r.setReason(req.reason());
    r.setStatus("waiting");
    r.setCreatedAt(Instant.now());
    Report saved = repo.save(r);
    return toDto(saved);
  }

  public List<ReportDto> getAll() {
    return repo.findAll().stream().map(this::toDto).toList();
  }

  @Transactional
  public void handleReport(UUID reportId, String action) {
    Report report = repo.findById(reportId)
        .orElseThrow(() -> new IllegalArgumentException("Report not found"));

    switch (action) {
      case "delete_post" -> {
        if (report.getReportedPostId() != null) {
          jdbc.update("DELETE FROM posts WHERE id = ?", report.getReportedPostId());
        }
      }
      case "ban_user" -> {
        jdbc.update("UPDATE users SET status='banned' WHERE id = ?", report.getReportedUserId());
      }
    }

    report.setStatus("resolved");
    repo.save(report);
  }

  public ReportDto updateStatus(UUID id, String status) {
    Report r = repo.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Report not found"));
    r.setStatus(status);
    return toDto(repo.save(r));
  }

  private ReportDto toDto(Report r) {

    String reporterUsername = userRepo.findById(r.getReporterId())
        .map(User::getUsername)
        .orElse("unknown");

    String reportedUsername = userRepo.findById(r.getReportedUserId())
        .map(User::getUsername)
        .orElse("unknown");

    return new ReportDto(
        r.getId(),

        r.getReporterId(),
        reporterUsername,

        r.getReportedUserId(),
        reportedUsername,

        r.getReportedPostId(),
        r.getReportedCommentId(),

        r.getCategory(),
        r.getReason(),
        r.getStatus(),
        r.getCreatedAt());
  }

  public void deleteReportedPost(UUID postId) {
    postRepo.deleteById(postId);
  }

  public void banUser(UUID userId) {
    User user = userRepo.findById(userId).orElseThrow();
    userRepo.save(user);
  }
}
