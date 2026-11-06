package com.everytable.api.member.security;

import com.everytable.api.member.entity.Member;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

// Member 엔티티를 Spring Security 인증 정보로 감싸는 어댑터
public class MemberUserDetails implements UserDetails {

    private final Member member;

    public MemberUserDetails(Member member) {
        this.member = member;
    }

    public Member getMember() {
        return member;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<String> roles = member.getRoles();
        return roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return member.getPw();
    }

    @Override
    public String getUsername() {
        return member.getLoginId();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // 정지/탈퇴/파기 상태는 잠긴 계정으로 처리
        return "정상".equals(member.getStatus()) || "휴면".equals(member.getStatus());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !"탈퇴".equals(member.getStatus()) && !"파기".equals(member.getStatus());
    }
}
