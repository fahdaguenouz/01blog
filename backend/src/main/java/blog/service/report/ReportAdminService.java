package blog.service.report;

import blog.dto.ReportDto;
import blog.mapper.ReportMapper;
import blog.models.Report;
import blog.models.User;
import blog.repository.ReportRepository;
import blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportAdminService {

  private static final Set<String> ALLOWED_STATUSES = Set.of("waiting", "resolved", "rejected");

  private final ReportRepository reports;
  private final UserRepository users;
  private final ReportMapper mapper;

  @Transactional(readOnly = true)
  public List<ReportDto> getAll() {
    return reports.findAll().stream().map(mapper::toDto).toList();
  }

  public void updateStatus(UUID reportId, String status) {
    if (status == null || !ALLOWED_STATUSES.contains(status)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    }

    Report r = reports.findById(reportId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));

    r.setStatus(status);
    reports.save(r);
  }

  public void banUser(UUID userId) {
    User u = users.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    // ✅ your old code didn't change anything; this fixes it:
    u.setStatus("banned");
    users.save(u);
  }
}
