package com.everytable.api.notice.service;

import com.everytable.api.notice.vo.NoticeVO;
import com.everytable.api.util.page.PageObject;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface NoticeService {
    List<NoticeVO> list(PageObject pageObject); // pageObject.key = 카테고리 번호(1~4), 없으면 전체
    NoticeVO view(Long no, boolean increaseHit);
    NoticeVO write(NoticeVO vo, String writerId, MultipartFile imageFile) throws Exception;
    int update(NoticeVO vo, MultipartFile imageFile, boolean deleteImage) throws Exception;
    int delete(Long no);
}
