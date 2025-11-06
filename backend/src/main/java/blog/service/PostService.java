// src/main/java/blog/service/PostService.java
package blog.service;

import blog.dto.PostDetailDto;
import blog.dto.PostSummaryDto;
import blog.mapper.PostMapper;
import blog.models.Post;
import blog.repository.PostRepository;
import java.util.UUID;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

@Service
public class PostService {

  private final PostRepository posts;

  public PostService(PostRepository posts) {
    this.posts = posts;
  }

  public Page<PostSummaryDto> listPublic(String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(PostMapper::toSummary);
  }

  public Page<PostSummaryDto> listByAuthor(UUID userId, String status, int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    return posts.findByAuthorIdAndStatus(userId, status, pageable)
                .map(PostMapper::toSummary);
  }

  public PostDetailDto getOne(UUID id) {
    Post p = posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Post not found"));
    return PostMapper.toDetail(p);
  }
}
