package blog.controller;

import blog.dto.CreateReportRequest;
import blog.dto.ReportDto;
import blog.service.report.ReportAdminService;
import blog.service.report.ReportUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportUserService userService;
    private final ReportAdminService adminService;

    // USER: create report
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportDto create(@Valid @RequestBody CreateReportRequest body, Authentication auth) {
        return userService.create(auth.getName(), body);
    }

    // ADMIN: list all reports
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReportDto> getAll() {
        return adminService.getAll();
    }

    // ADMIN: update report status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID id, @RequestBody UpdateStatusBody body) {
        adminService.updateStatus(id, body.status());
        return ResponseEntity.noContent().build();
    }

    // ADMIN: ban user (from reports page)
    @PatchMapping("/users/{userId}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> banUser(@PathVariable UUID userId) {
        adminService.banUser(userId);
        return ResponseEntity.noContent().build();
    }

    public record UpdateStatusBody(String status) {
    }
}
