// src/main/java/blog/controller/admin/AdminStatsController.java
package blog.controller.admin;

import blog.dto.*;
import blog.service.admin.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor

public class AdminStatsController {

  private final AdminStatsService service;

  @GetMapping
  public ResponseEntity<StatsDto> getStats() {
    return ResponseEntity.ok(service.getStats());
  }

  @GetMapping("/trends")
  public ResponseEntity<List<DailyStatsDto>> getTrends(@RequestParam(defaultValue = "30d") String period) {
    return ResponseEntity.ok(service.getDailyStats(period));
  }

  @GetMapping("/report-categories")
  public ResponseEntity<List<ReportCategoryCountDto>> getReportCategoryStats() {
    return ResponseEntity.ok(service.getReportCategoryStats());
  }

  @GetMapping("/top-contributors")
  public ResponseEntity<List<TopContributorDto>> getTopContributors(@RequestParam(defaultValue = "10") int limit) {
    return ResponseEntity.ok(service.getTopContributors(limit));
  }
}
