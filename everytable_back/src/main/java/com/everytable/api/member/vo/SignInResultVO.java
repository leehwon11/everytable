package com.everytable.api.member.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 로그인 성공 시 응답으로 내려주는 DTO. SignUpResultDto(success/code/msg)를 상속하고
 * token/id/name/gradeNo/gradeName을 추가로 담는다.
 *
 * 부모 클래스의 필드까지 builder()에서 한 번에 채우려면 @Builder가 아니라
 * 상속을 지원하는 @SuperBuilder를 부모/자식 클래스 모두에 사용해야 한다.
 * (@Builder만 쓰면 자식 클래스에 선언된 필드만 빌더에 노출되어
 *  SignInResultDto.builder().success(true)... 처럼 부모 필드를 채우는 코드가 컴파일되지 않는다.)
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class SignInResultVO extends SignUpResultVO {
    private String token;
    private String id;
    private String name;
    private Integer gradeNo;
    private String gradeName;
}
