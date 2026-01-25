package blog.service.report;

import blog.dto.CreateReportRequest;
import blog.dto.ReportDto;
import blog.mapper.ReportMapper;
import blog.models.Report;
import blog.models.User;
import blog.repository.ReportRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportUserService {

  private final UserRepository users;
  private final ReportRepository reports;
  private final ReportMapper mapper;

  public ReportDto create(String reporterUsername, CreateReportRequest req) {
    User reporter = users.findByUsername(reporterUsername)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));

    if (req.reportedUserId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reportedUserId is required");
    }
    if (req.reportedPostId() == null && req.reportedCommentId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reportedPostId or reportedCommentId is required");
    }
    if (req.reason() == null || req.reason().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required");
    }

    Report r = new Report();
    r.setReporterId(reporter.getId());
    r.setReportedUserId(req.reportedUserId());
    r.setReportedPostId(req.reportedPostId());
    r.setReportedCommentId(req.reportedCommentId());
    r.setCategory(req.category());
    r.setReason(req.reason().trim());
    r.setStatus("waiting");
    r.setCreatedAt(LocalDateTime.now());

    return mapper.toDto(reports.save(r));
  }
}
