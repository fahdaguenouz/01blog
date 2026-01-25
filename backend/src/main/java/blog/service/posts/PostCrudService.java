package blog.service.posts;

import blog.dto.PostDetailDto;
import blog.enums.NotificationType;
import blog.models.*;
import blog.repository.*;
import blog.service.LocalMediaStorage;
import blog.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PostCrudService {

  private final PostRepository posts;
  private final UserRepository users;

  private final LikeRepository likes;
  private final CommentRepository comments;
  private final SavedPostRepository savedPosts;

  private final MediaRepository mediaRepo;
  private final LocalMediaStorage mediaStorage;
  private final PostMediaRepository postMediaRepository;

  private final CategoryRepository categories;
  private final PostCategoryRepository postCategories;

  private final NotificationService notificationService;
  private final SubscriptionRepository subscriptions;

  private final PostValidator validator;
  private final PostSecurityHelper security;
  private final PostAssembler assembler;

  private User requireUser(String username) {
    return users.findByUsername(username)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }

  private Post requirePost(UUID postId) {
    return posts.findById(postId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
  }

  /*
   * ============================================================
   * CREATE
   * ============================================================
   */

  public PostDetailDto createPost(
      String username,
      String title,
      String body,
      List<MultipartFile> mediaFiles,
      List<UUID> categoryIds,
      List<String> mediaDescriptions) {
    User user = requireUser(username);

    title = validator.requireCleanText(title, "Title", 150);
    body = validator.requireCleanText(body, "Body", 10000);

    if (categoryIds == null || categoryIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post must have at least one category");
    }

    // ✅ normalize: remove null/empty files so we don't "think" there is media
    List<MultipartFile> files = (mediaFiles == null) ? List.of()
        : mediaFiles.stream().filter(f -> f != null && !f.isEmpty()).toList();

    boolean hasMedia = !files.isEmpty();
    if (files.size() > 5) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max 5 media files per post");
    }

    // ✅ RULE: post can have no media, but if media exists -> each one MUST have
    // description
    if (hasMedia) {
      if (mediaDescriptions == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each media must have a description");
      }
      if (mediaDescriptions.size() != mediaFiles.size()) {
        // important: compare with ORIGINAL list length, because Angular sends arrays
        // aligned by index
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Each media must have a description (descriptions count must match media count)");
      }

      // ✅ also validate per index (clear messages)
      for (int i = 0; i < mediaFiles.size(); i++) {
        MultipartFile f = mediaFiles.get(i);

        // if UI sent a slot but no file → explain
        if (f == null || f.isEmpty()) {
          throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Media file at index " + i + " is missing");
        }

        String d = (i < mediaDescriptions.size()) ? mediaDescriptions.get(i) : null;
        if (d == null || d.trim().isEmpty()) {
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "Media description is required for media at index " + i);
        }
        // sanitize & max len
        validator.requireCleanText(d, "Media description", 500);
      }
    }

    // ✅ Now safe to create post
    Post post = new Post();
    post.setAuthor(user);
    post.setTitle(title);
    post.setBody(body);
    post.setStatus("active");
    post.setCreatedAt(Instant.now());
    post = posts.save(post);

    // ---- notify subscribers
    List<UUID> subscriberIds = subscriptions.findSubscriberIdsBySubscribedToId(user.getId());
    if (subscriberIds != null && !subscriberIds.isEmpty()) {
      List<User> subs = users.findAllById(subscriberIds);
      for (User target : subs) {
        if (target.getId().equals(user.getId()))
          continue;
        notificationService.notify(target, user, NotificationType.FOLLOWING_POSTED, post, null);
      }
    }

    // ---- MEDIA
    if (hasMedia) {
      postMediaRepository.deleteByPostId(post.getId());

      for (int i = 0; i < mediaFiles.size(); i++) {
        MultipartFile file = mediaFiles.get(i);
        String description = validator.requireCleanText(mediaDescriptions.get(i), "Media description", 500);

        var stored = mediaStorage.save(file);
        if (stored == null) {
          throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store media");
        }

        Media media = new Media();
        media.setUserId(user.getId());
        media.setMediaType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        media.setSize((int) file.getSize());
        media.setUrl(stored.url());
        media.setUploadedAt(OffsetDateTime.now().toInstant());
        Media savedMedia = mediaRepo.save(media);

        PostMedia pm = new PostMedia();
        pm.setPostId(post.getId());
        pm.setMediaId(savedMedia.getId());
        pm.setDescription(description);
        pm.setPosition(i + 1);
        pm.setCreatedAt(LocalDateTime.now());
        postMediaRepository.save(pm);
      }
    }

    // ---- CATEGORIES (replace all)
    replaceCategories(post.getId(), categoryIds);

    posts.flush();
    postMediaRepository.flush();

    Post fresh = requirePost(post.getId());
    return assembler.toDetail(fresh, (UUID) null);
  }

  /*
   * ============================================================
   * UPDATE
   * ============================================================
   */
  public PostDetailDto updatePost(
      String username,
      UUID postId,
      String title,
      String body,

      // new
      List<MultipartFile> newMediaFiles,
      List<String> newDescriptions,

      // existing
      List<UUID> existingMediaIds,
      List<Boolean> removeExistingFlags,
      List<Boolean> replaceExistingFlags,
      List<String> existingDescriptions,

      // replacements
      List<MultipartFile> replacementFiles,
      List<String> replacementDescriptions,

      // categories
      List<UUID> categoryIds) {
    User user = requireUser(username);
    Post post = requirePost(postId);
    security.assertOwner(post, user);

    if (categoryIds == null || categoryIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post must have at least one category");
    }

    title = validator.requireCleanText(title, "Title", 150);
    body = validator.requireCleanText(body, "Body", 10000);

    post.setTitle(title);
    post.setBody(body);
    posts.save(post);

    // Load current post media
    List<PostMedia> existingMedia = postMediaRepository.findByPostIdOrderByPositionAsc(postId);
    Map<UUID, PostMedia> dbMap = existingMedia.stream()
        .collect(Collectors.toMap(PostMedia::getId, pm -> pm));

    Set<UUID> seen = new HashSet<>();
    List<PostMedia> kept = new ArrayList<>();

    int replIdx = 0;
 
    // ----- EXISTING MEDIA (keep/remove/replace) -----
    if (existingMediaIds != null) {
      for (int i = 0; i < existingMediaIds.size(); i++) {
        UUID pmId = existingMediaIds.get(i);
        if (pmId == null)
          continue;

        PostMedia pm = dbMap.get(pmId);
        if (pm == null)
          continue;

        seen.add(pmId);

        boolean remove = removeExistingFlags != null && removeExistingFlags.size() > i
            && Boolean.TRUE.equals(removeExistingFlags.get(i));

        boolean replace = replaceExistingFlags != null && replaceExistingFlags.size() > i
            && Boolean.TRUE.equals(replaceExistingFlags.get(i));

        String desc = (existingDescriptions != null && existingDescriptions.size() > i)
            ? existingDescriptions.get(i)
            : null;

        if (remove) {
          postMediaRepository.delete(pm);
          continue;
        }

        if (replace) {
          if (replacementFiles == null || replIdx >= replacementFiles.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Replacement file missing");
          }

          MultipartFile file = replacementFiles.get(replIdx);

          String replDesc = (replacementDescriptions != null && replIdx < replacementDescriptions.size())
              ? replacementDescriptions.get(replIdx)
              : desc;

          replDesc = validator.requireCleanText(replDesc, "Media description", 500);

          var stored = mediaStorage.save(file);
          if (stored == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store media");
          }

          Media media = new Media();
          media.setUserId(user.getId());
          media.setUrl(stored.url());
          media.setMediaType(file.getContentType());
          media.setSize((int) file.getSize());
          media.setUploadedAt(OffsetDateTime.now().toInstant());
          Media saved = mediaRepo.save(media);

          pm.setMediaId(saved.getId());
          pm.setDescription(replDesc);
          replIdx++;
        } else {
          desc = validator.requireCleanText(desc, "Media description", 500);
          pm.setDescription(desc);
        }

        kept.add(pm);
      }
    }
       int currentCount = kept.size();
    int newCount = (newMediaFiles == null) ? 0
        : (int) newMediaFiles.stream().filter(f -> f != null && !f.isEmpty()).count();

    if (currentCount + newCount > 5) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max 5 media files per post");
    }

    // delete DB media that client did not send back (extra safety)
    for (PostMedia pm : existingMedia) {
      if (!seen.contains(pm.getId())) {
        postMediaRepository.delete(pm);
      }
    }

    postMediaRepository.flush();

    // 2-phase position update (prevents uq_post_media_position conflicts)
    int tmp = 1000;
    for (PostMedia pm : kept)
      pm.setPosition(tmp++);
    postMediaRepository.saveAll(kept);
    postMediaRepository.flush();

    int position = 1;
    for (PostMedia pm : kept)
      pm.setPosition(position++);
    postMediaRepository.saveAll(kept);
    postMediaRepository.flush();

    // ----- NEW MEDIA (append after kept) -----
    if (newMediaFiles != null) {
      for (int i = 0; i < newMediaFiles.size(); i++) {
        MultipartFile file = newMediaFiles.get(i);
        if (file == null || file.isEmpty())
          continue;

        String desc = (newDescriptions != null && newDescriptions.size() > i)
            ? newDescriptions.get(i)
            : null;

        desc = validator.requireCleanText(desc, "Media description", 500);

        var stored = mediaStorage.save(file);
        if (stored == null) {
          throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store media");
        }

        Media media = new Media();
        media.setUserId(user.getId());
        media.setUrl(stored.url());
        media.setMediaType(file.getContentType());
        media.setSize((int) file.getSize());
        media.setUploadedAt(OffsetDateTime.now().toInstant());
        Media saved = mediaRepo.save(media);

        PostMedia pm = new PostMedia();
        pm.setPostId(postId);
        pm.setMediaId(saved.getId());
        pm.setDescription(desc);
        pm.setPosition(position++);
        pm.setCreatedAt(LocalDateTime.now());
        postMediaRepository.save(pm);
      }
    }

    // ----- CATEGORIES (replace all)
    replaceCategories(postId, categoryIds);

    return assembler.toDetail(post, user.getId());
  }

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */
  public void deletePost(String username, UUID postId) {
    User user = requireUser(username);
    Post post = requirePost(postId);
    security.assertOwner(post, user);

    // delete children first
    likes.deleteByPostId(postId);
    savedPosts.deleteByPostId(postId);
    comments.deleteByPostId(postId);
    postMediaRepository.deleteByPostId(postId);
    postCategories.deleteByPostId(postId);

    posts.delete(post);
  }

  /*
   * ============================================================
   * Internal helpers
   * ============================================================
   */
  private void replaceCategories(UUID postId, List<UUID> categoryIds) {
    postCategories.deleteByPostId(postId);

    if (categoryIds == null || categoryIds.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Post must have at least one category");
    }

    for (UUID cid : categoryIds) {
      if (cid == null)
        continue;
      if (!categories.existsById(cid))
        continue;

      PostCategory pc = new PostCategory();
      pc.setPostId(postId);
      pc.setCategoryId(cid);
      postCategories.save(pc);
    }
  }
}
