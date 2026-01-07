// src/main/java/blog/controller/ReportController.java
package blog.controller;

import blog.dto.CreateReportRequest;
import blog.dto.ReportDto;
import blog.models.User;
import blog.repository.UserRepository;
import blog.service.ReportService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepo;

    // USER: create report
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ReportDto create(@RequestBody CreateReportRequest body, Authentication auth) {
        String username = auth.getName();
        User reporter = userRepo.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Current user not found"));

        UUID reporterId = reporter.getId();
        return reportService.createReport(reporterId, body);
    }

    // ADMIN: list all reports
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReportDto> getAll(Authentication auth) {
        System.out.println("Authorities: " + auth.getAuthorities());
        return reportService.getAll();
    }

    // ADMIN: update report status

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        try {
            ReportDto updated = reportService.updateStatus(id, body.get("status"));
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("Report not found")) {
                return ResponseEntity.ok().build(); // 200 OK - idempotent
            }
            throw e;
        }
    }

    // ADMIN: ban user
    @DeleteMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void banUser(@PathVariable UUID userId) {
        reportService.banUser(userId);
    }
}
