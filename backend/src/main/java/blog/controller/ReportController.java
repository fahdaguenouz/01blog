// src/main/java/blog/controller/ReportController.java
package blog.controller;

import blog.dto.CreateReportRequest;
import blog.dto.ReportDto;
import blog.models.User;
import blog.service.ReportService;
import blog.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

  private final ReportService service;
  private final UserService userService;

 @PostMapping
public ResponseEntity<ReportDto> create(
    @RequestBody CreateReportRequest req,
    Authentication auth
) {
  User current = userService.getCurrentUser(auth);
  UUID reporterId = current.getId();

  ReportDto dto = service.createReport(reporterId, req);
  return ResponseEntity.ok(dto);
}

  @GetMapping
  public ResponseEntity<List<ReportDto>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ReportDto> updateStatus(
      @PathVariable UUID id,
      @RequestBody StatusBody body
  ) {
    return ResponseEntity.ok(service.updateStatus(id, body.status()));
  }

  public record StatusBody(String status) {}
}
