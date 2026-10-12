package com.nekotalk.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nekotalk.dto.request.CreateUserRequest;
import com.nekotalk.dto.response.CreateUserResponse;
import com.nekotalk.dto.response.PageResponse;
import com.nekotalk.dto.response.UserDetailResponse;
import com.nekotalk.entity.Role;
import com.nekotalk.entity.User;
import com.nekotalk.exception.AppException;
import com.nekotalk.exception.ErrorCode;
import com.nekotalk.repository.RoleRepository;
import com.nekotalk.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static com.nekotalk.constant.AppConstant.USER_ROLE;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;

        public CreateUserResponse createUser(CreateUserRequest request) {
                if (userRepository.existsByEmail(request.getEmail())) {
                        throw new AppException(ErrorCode.USER_EXISTED);
                }

                User user = User.builder()
                                .email(request.getEmail())
                                .username(request.getUsername())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .build();

                Role role = roleRepository.findByName(USER_ROLE)
                                .orElseGet(() -> roleRepository.save(Role.builder()
                                                .name(USER_ROLE)
                                                .build()));

                user.addRole(role);
                userRepository.save(user);

                return CreateUserResponse.builder()
                                .email(user.getEmail())
                                .username(user.getUsername())
                                .build();
        }

        public UserDetailResponse getMyInfo(String userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

                UserDetailResponse response = UserDetailResponse.builder()
                                .userId(user.getId())
                                .email(user.getEmail())
                                .username(user.getUsername())
                                .build();

                return response;
        }

        public PageResponse<UserDetailResponse> searchUsers(String keyword, int page, int size) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                String userId = authentication.getName();

                Pageable pageable = PageRequest.of(page - 1, size);

                Page<User> users = userRepository.searchUsers(keyword, pageable);

                List<UserDetailResponse> content = users.getContent().stream()
                                .filter(user -> !user.getId().equals(userId))
                                .map(user -> UserDetailResponse.builder()
                                                .userId(user.getId())
                                                .email(user.getEmail())
                                                .username(user.getUsername())
                                                .build())
                                .toList();

                return PageResponse.<UserDetailResponse>builder()
                                .currentPage(page)
                                .pageSize(size)
                                .totalPages(users.getTotalPages())
                                .totalElements(users.getTotalElements())
                                .content(content)
                                .build();
        }
}
