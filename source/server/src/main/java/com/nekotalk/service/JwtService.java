package com.nekotalk.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.nekotalk.exception.AppException;
import com.nekotalk.exception.ErrorCode;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import static com.nekotalk.constant.AppConstant.AUTHORITIES;

@Service
@Slf4j(topic = "JWT-SERVICE")
@RequiredArgsConstructor
public class JwtService {

    @Value("${jwt.secret-key}")
    private String secretKey;

    public String generateAccessToken(String userId, Set<String> authorities) {
        JWSAlgorithm algorithm = JWSAlgorithm.HS512;
        JWSHeader header = new JWSHeader(algorithm);

        Date issueTime = new Date();
        Date expiredTime = new Date(Instant.now().plus(2, ChronoUnit.HOURS).toEpochMilli());

        String jwtId = UUID.randomUUID().toString();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(userId)
                .issueTime(issueTime)
                .expirationTime(expiredTime)
                .jwtID(jwtId)
                .claim(AUTHORITIES, authorities)
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(secretKey));
        } catch (Exception e) {
            throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
        }

        return jwsObject.serialize();
    }

    public String generateRefreshToken(String userId) {
        JWSAlgorithm algorithm = JWSAlgorithm.HS512;
        JWSHeader header = new JWSHeader(algorithm);

        Date issueTime = new Date();
        Date expiredTime = new Date(Instant.now().plus(14, ChronoUnit.DAYS).toEpochMilli());

        String jwtId = UUID.randomUUID().toString();

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(userId)
                .issueTime(issueTime)
                .expirationTime(expiredTime)
                .jwtID(jwtId)
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(secretKey));
        } catch (Exception e) {
            throw new AppException(ErrorCode.TOKEN_GENERATION_FAILED);
        }
        return jwsObject.serialize();
    }

    public String validateRefreshToken(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            JWSVerifier verifier = new MACVerifier(secretKey.getBytes());

            boolean isVerifier = signedJWT.verify(verifier);
            if(!isVerifier) {
                log.warn("Refresh token signature verification failed");
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if(expirationTime == null || expirationTime.before(new Date())) {
                log.warn("Refresh token has expired");
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }

            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to validate refresh token: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
    }
}
