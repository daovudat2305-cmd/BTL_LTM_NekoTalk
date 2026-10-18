package com.nekotalk.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp"
    );

    public String uploadAvatar(MultipartFile file) {
        if(file.isEmpty()) {
            throw new IllegalArgumentException("File tải lên không được rỗng");
        }

        String contentType = file.getContentType();
        if(contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Chỉ chấp nhận file ảnh định dạng JPEG, PNG hoặc WEBP");
        }

        try {
            Map<?,?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(), 
                ObjectUtils.asMap("resource_type", "image")
            );

            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("Lỗi khi stream dữ liệu ảnh lên Cloudinary: {}", e.getMessage());
            throw new RuntimeException("Không thể tải ảnh lên Cloudinary");
        }
    }
}
