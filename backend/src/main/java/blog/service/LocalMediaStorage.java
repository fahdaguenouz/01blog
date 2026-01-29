package blog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalMediaStorage {

  private final Path root;
  private final String publicBaseUrl;
  private static final Set<String> ALLOWED_MIME = Set.of(
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "video/mp4"
      
  );
  public LocalMediaStorage(
      @Value("${media.upload.dir:uploads}") String uploadDir,
      @Value("${media.public.base-url:/uploads}") String baseUrl // recommend relative
  ) {
    this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    this.publicBaseUrl = baseUrl;
    try {
      Files.createDirectories(root);
    } catch (Exception ignored) {
    }
  }

  public SavedFile save(MultipartFile file) {
    if (file == null || file.isEmpty())return null;

    var detected = MediaSniffer.detect(file);
    if (detected == null || detected.mime() == null || !ALLOWED_MIME.contains(detected.mime())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or unsupported media file");
    }

    
     String name = UUID.randomUUID() + "." + detected.ext();
    Path target = root.resolve(name);
    try {
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
      String url = publicBaseUrl.endsWith("/") ? publicBaseUrl + name : publicBaseUrl + "/" + name;
      return new SavedFile(url, (int) file.getSize(), file.getContentType());
    } catch (Exception e) {
      throw new RuntimeException("Failed to save media", e);
    }
  }

  public void deleteByUrl(String url) {
    if (url == null || url.isBlank())
      return;

    // supports "/uploads/name.png" or "/uploads/name.png?x=y"
    String clean = url.split("\\?")[0];

    // Only delete files that live under our publicBaseUrl
    String base = publicBaseUrl.endsWith("/") ? publicBaseUrl : publicBaseUrl + "/";
    if (!clean.startsWith(base))
      return;

    String filename = clean.substring(base.length());
    if (filename.isBlank())
      return;

    Path target = root.resolve(filename).normalize();

    // Safety: ensure it doesn't escape root
    if (!target.startsWith(root))
      return;

    try {
      Files.deleteIfExists(target);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to delete media file: " + target.getFileName(), e);
    }
  }


  public record SavedFile(String url, Integer size, String contentType) {
  }
}
