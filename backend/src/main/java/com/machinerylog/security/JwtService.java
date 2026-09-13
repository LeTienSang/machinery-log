package com.machinerylog.security;

import com.machinerylog.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final long accessTokenMinutes;
    private final long refreshTokenDays;

    public JwtService(
        @Value("${machinery-log.security.jwt-secret}") String secret,
        @Value("${machinery-log.security.access-token-minutes}") long accessTokenMinutes,
        @Value("${machinery-log.security.refresh-token-days}") long refreshTokenDays
    ) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64URL.decode(encodeSecret(secret)));
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenDays = refreshTokenDays;
    }

    public String createAccessToken(User user) {
        return createToken(user, accessTokenMinutes, ChronoUnit.MINUTES, "access");
    }

    public String createRefreshToken(User user) {
        return createToken(user, refreshTokenDays, ChronoUnit.DAYS, "refresh");
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    public boolean isRefreshToken(String token) {
        return "refresh".equals(parse(token).get("type", String.class));
    }

    public boolean isValid(String token, User user) {
        return user.getUsername().equals(extractUsername(token)) && !parse(token).getExpiration().before(new Date());
    }

    public long getAccessTokenSeconds() { return accessTokenMinutes * 60; }

    private String createToken(User user, long amount, ChronoUnit unit, String type) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(user.getUsername())
            .claims(Map.of("role", user.getRole().name(), "type", type))
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(amount, unit)))
            .signWith(signingKey)
            .compact();
    }

    private Claims parse(String token) {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
    }

    private String encodeSecret(String secret) {
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
