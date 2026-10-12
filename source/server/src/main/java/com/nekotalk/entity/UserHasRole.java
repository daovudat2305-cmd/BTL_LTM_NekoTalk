package com.nekotalk.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.*;

@Entity
@Table(name = "user_has_role")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserHasRole {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;

    @ManyToOne
    @JoinColumn(name = "role_id")
    Role role;
}
