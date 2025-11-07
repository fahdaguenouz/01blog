package blog.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.UUID;

@Service
public class LocalMediaStorage {

  private final Path root;
  private final String publicBaseUrl;

  public LocalMediaStorage(
      @Value("${media.upload.dir:uploads}") String uploadDir,
      @Value("${media.public.base-url:/uploads}") String baseUrl // recommend relative
  ) {
    this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    this.publicBaseUrl = baseUrl;
    try { Files.createDirectories(root); } catch (Exception ignored) {}
  }

  public SavedFile save(MultipartFile file) {
    if (file == null || file.isEmpty()) return null;
    String ext = getExt(file.getOriginalFilename());
    String name = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
    Path target = root.resolve(name);
    try {
      Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
      String url = publicBaseUrl.endsWith("/") ? publicBaseUrl + name : publicBaseUrl + "/" + name;
      return new SavedFile(url, (int) file.getSize(), file.getContentType());
    } catch (Exception e) {
      throw new RuntimeException("Failed to save media", e);
    }
  }

  private static String getExt(String fn) {
    if (fn == null) return "";
    int dot = fn.lastIndexOf('.');
    return dot > 0 ? fn.substring(dot + 1) : "";
  }

  public record SavedFile(String url, Integer size, String contentType) {}
}
