package com.nekotalk.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.nekotalk.entity.RevokedRefreshToken;

@Repository
public interface RevokedRefreshTokenRepository extends JpaRepository<RevokedRefreshToken,String>{
    
}
