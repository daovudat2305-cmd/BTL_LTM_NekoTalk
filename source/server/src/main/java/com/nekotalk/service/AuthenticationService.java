package com.nekotalk.service;

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

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationService {

        private final UserRepository userRepository;
        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;

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
                String userId = jwtService.validateRefreshToken(request.getRefreshToken());

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
}
