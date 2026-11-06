package com.everytable.api.member.security;

import com.everytable.api.member.entity.Member;
import com.everytable.api.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// 원본 everytable.util.filter.AuthorityFilter(세션 기반 권한 체크)를 대체.
// JwtTokenProvider가 토큰에서 뽑아낸 아이디로 이 서비스를 호출해서 인증 정보를 만든다.
@Service
@RequiredArgsConstructor
public class MemberUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String loginId) throws UsernameNotFoundException {
        Member member = memberRepository.findByLoginId(loginId)
                .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 아이디입니다: " + loginId));
        return new MemberUserDetails(member);
    }
}
