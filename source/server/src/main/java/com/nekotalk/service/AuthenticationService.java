package com.nekotalk.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nekotalk.dto.request.LoginRequest;
import com.nekotalk.dto.request.RefreshTokenRequest;
import com.nekotalk.dto.response.LoginResponse;
import com.nekotalk.entity.User;
import com.nekotalk.exception.AppException;
import com.nekotalk.exception.ErrorCode;
import com.nekotalk.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.nekotalk.entity.RevokedRefreshToken;
import com.nekotalk.repository.RevokedRefreshTokenRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationService {

        private final UserRepository userRepository;
        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final RevokedRefreshTokenRepository revokedRefreshTokenRepository;

        @Transactional (readOnly = true)
        public LoginResponse login(LoginRequest request) {
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                                request.getEmail(), request.getPassword());

                Authentication authentication = authenticationManager.authenticate(authenticationToken);

                User user = (User) authentication.getPrincipal();

                if (user == null) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                Set<String> authorities = user.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.toSet());

                String accessToken = jwtService.generateAccessToken(user.getId(), authorities);
                String refreshToken = jwtService.generateRefreshToken(user.getId());

                return LoginResponse.builder()
                                .userId(user.getId())
                                .accessToken(accessToken)
                                .refreshToken(refreshToken)
                                .build();
        }

        @Transactional (readOnly = true)
        public LoginResponse refreshToken(RefreshTokenRequest request) {
                String refreshToken = request.getRefreshToken();
                String userId = jwtService.validateRefreshToken(refreshToken);

                String tokenHash = hashToken(refreshToken);
                // Từ chối refresh token đã bị thu hồi.
                if(revokedRefreshTokenRepository.existsById(tokenHash)){
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
                
                // lấy danh sách quyền hạn mới nhất
                Set<String> authorities = user.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toSet());

                // sinh accessToken mới và refreshToken mới
                String newAccessToken = jwtService.generateAccessToken(user.getId(), authorities);
                String newRefreshToken = jwtService.generateRefreshToken(user.getId());
                return LoginResponse.builder()
                        .userId(user.getId())
                        .accessToken(newAccessToken)
                        .refreshToken(newRefreshToken)
                        .build();
        }
        // Thu hồi refresh token thuộc phiên đăng xuất này.
        @Transactional
        public void logout(String authenticatedUserId,String refreshToken){
                String tokenUserId = jwtService.validateRefreshToken(refreshToken);

                if(!authenticatedUserId.equals(tokenUserId)){
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                String tokenHash= hashToken(refreshToken);

                if(!revokedRefreshTokenRepository.existsById(tokenHash)){
                        revokedRefreshTokenRepository.save(
                                new RevokedRefreshToken(tokenHash,authenticatedUserId,Instant.now()));
                }

        }
        // Chỉ lưu hash token trong cơ sở dữ liệu.
        private String hashToken(String token){
                try{
                        byte[] digest= MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));

                        return HexFormat.of().formatHex(digest);
                }catch (NoSuchAlgorithmException e){
                        throw new IllegalStateException("SHA-256 is unavailable",e);
                }
        }
       
}
