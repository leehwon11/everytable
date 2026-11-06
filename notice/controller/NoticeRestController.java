package com.everytable.api.notice.controller;

import com.everytable.api.member.security.MemberUserDetails;
import com.everytable.api.notice.service.NoticeService;
import com.everytable.api.notice.vo.NoticeVO;
import com.everytable.api.util.page.PageObject;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 원본 everytable.notice.controller.NoticeController 이식.
 * 원본 JSP(list.jsp)에서 공지 등록 버튼은 login.gradeNo == 9(관리자)에게만 보였으므로
 * write.do/update.do/delete.do 는 ROLE_ADMIN 으로 제한했다.
 */
@RestController
@RequestMapping("/notice")
@RequiredArgsConstructor
public class NoticeRestController {

    private final NoticeService noticeService;

    // 1. 목록 (누구나 조회 가능) - pageObject.key 로 카테고리(1~4) 필터
    @GetMapping("/list.do")
    public ResponseEntity<Map<String, Object>> list(HttpServletRequest request) {
        PageObject pageObject = PageObject.getInstance(request);
        Map<String, Object> result = new HashMap<>();
        result.put("list", noticeService.list(pageObject));
        result.put("pageObject", pageObject);
        return ResponseEntity.status(HttpStatus.OK).body(result);
    }

    // 2. 상세보기 (inc=1 이면 조회수 증가)
    @GetMapping("/view.do")
    public NoticeVO view(Long no, Integer inc) {
        return noticeService.view(no, inc != null && inc == 1);
    }

    // 3. 등록 (관리자 전용, multipart/form-data)
    @PostMapping(value = "/write.do", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public NoticeVO write(@RequestParam String title,
                           @RequestParam String content,
                           @RequestParam Integer cateNo,
                           @RequestParam(required = false) MultipartFile imageFile,
                           Authentication authentication) throws Exception {
        NoticeVO vo = new NoticeVO();
        vo.setTitle(title);
        vo.setContent(content);
        vo.setCateNo(cateNo);

        String writerId = ((MemberUserDetails) authentication.getPrincipal()).getUsername();
        return noticeService.write(vo, writerId, imageFile);
    }

    // 4. 수정 (관리자 전용, multipart/form-data)
    @PostMapping(value = "/update.do", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(@RequestParam Long no,
                                       @RequestParam String title,
                                       @RequestParam String content,
                                       @RequestParam Integer cateNo,
                                       @RequestParam(required = false) MultipartFile imageFile,
                                       @RequestParam(required = false, defaultValue = "false") boolean deleteImage) throws Exception {
        NoticeVO vo = new NoticeVO();
        vo.setNoticeNo(no);
        vo.setTitle(title);
        vo.setContent(content);
        vo.setCateNo(cateNo);

        int result = noticeService.update(vo, imageFile, deleteImage);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }

    // 5. 삭제 (관리자 전용)
    @PostMapping("/delete.do")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> delete(@RequestBody Map<String, Object> body) {
        Long no = Long.valueOf(body.get("no").toString());
        int result = noticeService.delete(no);
        return Map.of("result", result == 1 ? "ok" : "fail");
    }
}
