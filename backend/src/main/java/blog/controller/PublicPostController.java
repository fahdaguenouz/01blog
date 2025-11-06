// src/main/java/blog/controller/PublicPostController.java
package blog.controller;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.service.PostService;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/posts")
public class PublicPostController {

  private final PostService postService;

  public PublicPostController(PostService postService) {
    this.postService = postService;
  }

  @GetMapping
  public Page<PostSummaryDto> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "active") String status
  ) {
    return postService.listPublic(status, page, size);
  }

  @GetMapping("/by-user/{userId}")
  public Page<PostSummaryDto> listByUser(
      @PathVariable UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(defaultValue = "active") String status
  ) {
    return postService.listByAuthor(userId, status, page, size);
  }

  @GetMapping("/{id}")
  public PostDetailDto get(@PathVariable UUID id) {
    return postService.getOne(id);
  }
}
