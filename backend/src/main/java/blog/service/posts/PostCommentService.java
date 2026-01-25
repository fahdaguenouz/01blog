package blog.service.posts;

import blog.dto.CommentDto;
import blog.enums.NotificationType;
import blog.models.Comment;
import blog.models.Media;
import blog.models.Post;
import blog.models.User;
import blog.repository.CommentRepository;
import blog.repository.MediaRepository;
import blog.repository.PostRepository;
import blog.repository.UserRepository;
import blog.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PostCommentService {

    private final UserRepository users;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final MediaRepository mediaRepo;
    private final NotificationService notificationService;
    private final PostValidator validator;
    private final PostSecurityHelper security;

  

    private User requireUser(String username) {
        return users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private Post requirePost(UUID postId) {
        return posts.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    public CommentDto addComment(String username, UUID postId, String content) {
        User user = requireUser(username);
        Post post = requirePost(postId);
        if ("hidden".equalsIgnoreCase(post.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Post is hidden");
        }
        content = validator.requireCleanText(content, "Comment", 2000);

        Comment c = new Comment();
        c.setId(UUID.randomUUID());
        c.setPostId(post.getId());
        c.setUserId(user.getId());
        c.setText(content);
        c.setCreatedAt(LocalDateTime.now());
        comments.saveAndFlush(c);

        int current = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
        post.setCommentsCount(current + 1);
        posts.saveAndFlush(post);

        notificationService.notify(post.getAuthor(), user, NotificationType.POST_COMMENTED, post, c.getId());
        String avatarUrl = "svg/avatar.png";
        if (user.getAvatarMediaId() != null) {
            avatarUrl = mediaRepo.findById(user.getAvatarMediaId())
                    .map(Media::getUrl)
                    .orElse("svg/avatar.png");
        }
        return new CommentDto(
                c.getId(),
                c.getPostId(),
                c.getUserId(),
                user.getUsername(),
                avatarUrl,
                c.getText(),
                c.getCreatedAt().toString());
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getComments(UUID postId) {
        return comments.findByPostIdOrderByCreatedAtDesc(postId).stream()
                .map(c -> {
                    User user = users.findById(c.getUserId()).orElse(null);
                    String username = user != null ? user.getUsername() : "user";

                    String avatarUrl = "svg/avatar.png";
                    if (user != null && user.getAvatarMediaId() != null) {
                        avatarUrl = mediaRepo.findById(user.getAvatarMediaId())
                                .map(Media::getUrl)
                                .orElse("svg/avatar.png");
                    }

                    return new CommentDto(
                            c.getId(),
                            c.getPostId(),
                            c.getUserId(),
                            username,
                            avatarUrl,
                            c.getText(),
                            c.getCreatedAt().toString());
                })
                .toList();
    }

    public void deleteComment(String username, UUID postId, UUID commentId) {
        User user = requireUser(username);

        Comment c = comments.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!c.getPostId().equals(postId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment does not belong to this post");
        }

        Post post = requirePost(postId);

        boolean isCommentOwner = c.getUserId().equals(user.getId());
        boolean isPostOwner = post.getAuthor() != null && post.getAuthor().getId().equals(user.getId());

        if (!isCommentOwner && !isPostOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        notificationService.deleteCommentNotification(postId, commentId);
        comments.delete(c);

        int current = post.getCommentsCount() == null ? 0 : post.getCommentsCount();
        post.setCommentsCount(Math.max(0, current - 1));
        posts.saveAndFlush(post);
    }
}
