package blog.service.posts;

import blog.dto.CategoryDto;
import blog.dto.PostDetailDto;
import blog.mapper.PostMapper;
import blog.models.Post;
import blog.repository.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Component
public class PostAssembler {

  private final LikeRepository likes;
  private final SavedPostRepository savedPosts;
  private final CategoryRepository categories;
  private final PostCategoryRepository postCategories;
  private final MediaRepository mediaRepo;
  private final PostMediaRepository postMediaRepo;

  public PostAssembler(
      LikeRepository likes,
      SavedPostRepository savedPosts,
      CategoryRepository categories,
      PostCategoryRepository postCategories,
      MediaRepository mediaRepo,
      PostMediaRepository postMediaRepo
  ) {
    this.likes = likes;
    this.savedPosts = savedPosts;
    this.categories = categories;
    this.postCategories = postCategories;
    this.mediaRepo = mediaRepo;
    this.postMediaRepo = postMediaRepo;
  }

  private List<CategoryDto> getCategoryDtos(UUID postId) {
    return postCategories.findByPostId(postId).stream()
        .map(pc -> categories.findById(pc.getCategoryId())
            .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
            .orElse(null))
        .filter(Objects::nonNull)
        .toList();
  }

  public PostDetailDto toDetail(Post post, UUID currentUserId) {
    boolean isLiked = currentUserId != null && likes.findByUserIdAndPostId(currentUserId, post.getId()).isPresent();
    boolean isSaved = currentUserId != null && savedPosts.findByUserIdAndPostId(currentUserId, post.getId()).isPresent();
    return toDetail(post, isLiked, isSaved);
  }

  public PostDetailDto toDetail(Post post, boolean isLiked, boolean isSaved) {
    List<CategoryDto> cats = getCategoryDtos(post.getId());
    return PostMapper.toDetail(post, mediaRepo, postMediaRepo, cats, isLiked, isSaved);
  }
}
