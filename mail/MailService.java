package com.everytable.api.mail;

// 원본 everytable.util.mail.Mail.sendMail(to, subject, content) 과 동일한 시그니처.
// 구현은 JavaMailSenderMailService 참고 (application.properties의 spring.mail.* 설정 필요).
public interface MailService {
    void sendMail(String to, String subject, String content) throws Exception;
}
