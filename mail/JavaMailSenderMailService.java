package com.everytable.api.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * 원본 everytable.util.mail.Mail 클래스를 Spring의 JavaMailSender로 이식.
 * 원본은 Gmail SMTP 접속 정보(계정+앱비밀번호)를 클래스에 직접 하드코딩했는데,
 * 이 프로젝트에서는 application.properties(spring.mail.*)의 설정값을 사용한다.
 * (해당 값은 이 저장소에 포함되어 있지 않으며, 실제 발송을 하려면 직접 채워야 한다.)
 */
@Service
@RequiredArgsConstructor
@Log4j2
public class JavaMailSenderMailService implements MailService {

    private final JavaMailSender mailSender;

    @Value("${mail.from.address:}")
    private String fromAddress;

    @Value("${mail.from.name:everytable}")
    private String fromName;

    @Override
    public void sendMail(String to, String subject, String content) throws Exception {
        if (fromAddress == null || fromAddress.isBlank()) {
            // spring.mail.username 이 비어있으면 여기서 바로 실패한다 (원본과 달리 가짜로 "성공"처럼 넘어가지 않음).
            throw new IllegalStateException(
                    "SMTP 계정이 설정되지 않았습니다. application.properties의 spring.mail.username/password를 채워주세요.");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setFrom(fromAddress, fromName);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(content, true); // HTML 형식 지원 (원본과 동일)

        mailSender.send(message);
        log.info("[sendMail] 메일 발송 완료. to = {}", to);
    }
}
