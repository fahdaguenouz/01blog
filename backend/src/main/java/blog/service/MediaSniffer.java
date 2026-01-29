package blog.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public final class MediaSniffer {

  private MediaSniffer() {}

  public record Detected(String mime, String ext) {}

  public static Detected detect(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
      byte[] h = in.readNBytes(64);
      if (h.length < 12) return null;

      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (startsWith(h, new byte[]{(byte)0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A})) {
        return new Detected("image/png", "png");
      }

      // JPEG: FF D8 FF
      if ((h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
        return new Detected("image/jpeg", "jpg");
      }

      // GIF: "GIF87a" or "GIF89a"
      String first6 = new String(h, 0, 6, StandardCharsets.US_ASCII);
      if ("GIF87a".equals(first6) || "GIF89a".equals(first6)) {
        return new Detected("image/gif", "gif");
      }

      // WEBP: "RIFF" .... "WEBP"
      String riff = new String(h, 0, 4, StandardCharsets.US_ASCII);
      String webp = new String(h, 8, 4, StandardCharsets.US_ASCII);
      if ("RIFF".equals(riff) && "WEBP".equals(webp)) {
        return new Detected("image/webp", "webp");
      }

      // MP4/M4V/MOV: [size][ftyp][brand]
      // bytes 4..7 == "ftyp"
      String box = new String(h, 4, 4, StandardCharsets.US_ASCII);
      if ("ftyp".equals(box)) {
        String brand = new String(h, 8, 4, StandardCharsets.US_ASCII);
        // common mp4 brands: isom, iso2, mp41, mp42, avc1, M4V , dash
        if (isMp4Brand(brand)) {
          return new Detected("video/mp4", "mp4");
        }
        // QuickTime MOV: "qt  "
        if ("qt  ".equals(brand)) {
          return new Detected("video/quicktime", "mov");
        }
        // If you prefer to reject unknown ftyp brands, return null here.
      }

      return null;
    } catch (Exception e) {
      return null;
    }
  }

  private static boolean startsWith(byte[] h, byte[] prefix) {
    if (h.length < prefix.length) return false;
    for (int i = 0; i < prefix.length; i++) {
      if (h[i] != prefix[i]) return false;
    }
    return true;
  }

  private static boolean isMp4Brand(String brand) {
    return "isom".equals(brand)
        || "iso2".equals(brand)
        || "mp41".equals(brand)
        || "mp42".equals(brand)
        || "avc1".equals(brand)
        || "dash".equals(brand)
        || "M4V ".equals(brand);
  }
}
