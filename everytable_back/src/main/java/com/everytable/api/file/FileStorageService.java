package com.everytable.api.file;

import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * 원본 NoticeController의 파일 업로드 처리(Part imageFile, UUID 파일명, servletContext.getRealPath)를
 * 이식. 저장 경로는 WebConfig의 정적 리소스 매핑(/upload/** -> app.upload.dir)과 일치해야 한다.
 */
@Service
@Log4j2
public class FileStorageService {

    @Value("${app.upload.dir:C:/Temp/upload}")
    private String uploadDir;

    // subDir 예: "notice" -> {uploadDir}/notice/{uuid}_{원본파일명} 에 저장하고
    // "/upload/notice/{uuid}_{원본파일명}" 형태의 URL 경로를 돌려준다.
    public String store(MultipartFile file, String subDir) throws IOException {
        if (file == null || file.isEmpty()) return null;

        Path dir = Path.of(uploadDir, subDir);
        Files.createDirectories(dir);

        String originalName = Path.of(file.getOriginalFilename()).getFileName().toString();
        String savedName = UUID.randomUUID() + "_" + originalName;
        Path target = dir.resolve(savedName);
        file.transferTo(target);

        String urlPath = "/upload/" + subDir + "/" + savedName;
        log.info("[store] 파일 저장 완료: {}", urlPath);
        return urlPath;
    }

    // urlPath 예: "/upload/notice/xxx_파일명.png"
    public void delete(String urlPath) {
        if (urlPath == null || urlPath.isBlank()) return;
        try {
            String relative = urlPath.startsWith("/upload/") ? urlPath.substring("/upload/".length()) : urlPath;
            File f = Path.of(uploadDir, relative).toFile();
            if (f.exists() && !f.delete()) {
                log.warn("[delete] 파일 삭제 실패: {}", f.getAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("[delete] 파일 삭제 중 오류: {}", e.getMessage());
        }
    }
}
