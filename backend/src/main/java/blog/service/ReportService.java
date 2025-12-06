// src/main/java/blog/service/ReportService.java
package blog.service;

import blog.dto.CreateReportRequest;
import blog.dto.ReportDto;
import blog.models.Report;
import blog.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {
  private final ReportRepository repo;

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

  public ReportDto updateStatus(UUID id, String status) {
    Report r = repo.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Report not found"));
    r.setStatus(status);
    return toDto(repo.save(r));
  }

  private ReportDto toDto(Report r) {
    return new ReportDto(
        r.getId(),
        r.getReporterId(),
        r.getReportedUserId(),
        r.getReportedPostId(),
        r.getReportedCommentId(),
        r.getCategory(),
        r.getReason(),
        r.getStatus(),
        r.getCreatedAt()
    );
  }
}
