// src/main/java/blog/controller/admin/AdminPostsController.java
package blog.controller.admin;

import blog.repository.CommentRepository;
import blog.repository.PostRepository;
import blog.repository.ReportRepository;
import blog.service.posts.PostAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/posts")
@RequiredArgsConstructor

public class AdminPostsController {

  private final PostRepository postRepo;
  private final CommentRepository commentRepo;
  private final ReportRepository reportRepo;
  private final PostAdminService postAdminService;

  @DeleteMapping("/{postId}")
  @Transactional
  public ResponseEntity<Void> deletePost(@PathVariable UUID postId) {
    postRepo.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

    // delete related content
    commentRepo.deleteByPostId(postId);
    reportRepo.deleteByReportedPostId(postId);

    postRepo.deleteById(postId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/{postId}/status")
  public ResponseEntity<Void> setStatus(@PathVariable UUID postId, @RequestBody Map<String, String> body) {
    String status = body != null ? body.get("status") : null;
    if (status == null || status.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing status");
    }
    postAdminService.adminSetPostStatus(postId, status);

    return ResponseEntity.ok().build();
  }
}
