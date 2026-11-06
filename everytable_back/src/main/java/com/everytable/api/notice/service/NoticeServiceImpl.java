package com.everytable.api.notice.service;

import com.everytable.api.file.FileStorageService;
import com.everytable.api.member.entity.Member;
import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.notice.entity.Notice;
import com.everytable.api.notice.entity.NoticeCate;
import com.everytable.api.notice.repository.NoticeCateRepository;
import com.everytable.api.notice.repository.NoticeRepository;
import com.everytable.api.notice.repository.NoticeRepositoryCustom;
import com.everytable.api.notice.vo.NoticeVO;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// 원본 everytable.notice.dao.NoticeDAO + notice.controller.NoticeController 의 파일업로드 로직 이식
//
// 팀 최종 스키마 반영: notice.writer(String, 로그인 아이디) -> admin_no(Long, member_no FK)로 바뀌어서
// MemberRepository로 로그인 아이디 <-> member_no 변환을 처리하고, cate_no가 이제 notice_cate 테이블의
// 실제 FK라서 카테고리 이름도 하드코딩 대신 NoticeCateRepository로 조회한다.
@Service
@RequiredArgsConstructor
public class NoticeServiceImpl implements NoticeService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final NoticeRepository noticeRepository;
    private final NoticeRepositoryCustom noticeRepositoryCustom;
    private final MemberRepository memberRepository;
    private final NoticeCateRepository noticeCateRepository;
    private final FileStorageService fileStorageService;

    @Override
    public List<NoticeVO> list(PageObject pageObject) {
        long total = noticeRepositoryCustom.searchCount(pageObject.getKey());
        pageObject.setTotalRow(total);

        List<Notice> notices = noticeRepositoryCustom.search(pageObject.getKey(), pageObject.getLimit(), pageObject.getPerPageNum());
        return toVOList(notices);
    }

    @Override
    @Transactional
    public NoticeVO view(Long no, boolean increaseHit) {
        if (increaseHit) {
            noticeRepositoryCustom.increaseHit(no);
        }
        Notice notice = noticeRepository.findById(no)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 공지입니다."));
        return toVO(notice);
    }

    @Override
    @Transactional
    public NoticeVO write(NoticeVO vo, String writerId, MultipartFile imageFile) throws Exception {
        Member writer = memberRepository.findByLoginId(writerId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 회원입니다."));
        String imagePath = fileStorageService.store(imageFile, "notice");

        Notice notice = Notice.builder()
                .title(vo.getTitle())
                .content(vo.getContent())
                .image(imagePath)
                .adminNo(writer.getNo())
                .cateNo(vo.getCateNo())
                .hit(0L)
                .build();

        return toVO(noticeRepository.save(notice));
    }

    @Override
    @Transactional
    public int update(NoticeVO vo, MultipartFile imageFile, boolean deleteImage) throws Exception {
        Notice notice = noticeRepository.findById(vo.getNoticeNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 공지입니다."));

        notice.setTitle(vo.getTitle());
        notice.setContent(vo.getContent());
        notice.setCateNo(vo.getCateNo());

        if (imageFile != null && !imageFile.isEmpty()) {
            String oldImage = notice.getImage();
            String newImage = fileStorageService.store(imageFile, "notice");
            notice.setImage(newImage);
            if (oldImage != null) fileStorageService.delete(oldImage);
        } else if (deleteImage) {
            if (notice.getImage() != null) fileStorageService.delete(notice.getImage());
            notice.setImage(null);
        }
        // else: 이미지 변경 없음 - 기존 값 유지

        noticeRepository.save(notice);
        return 1;
    }

    @Override
    @Transactional
    public int delete(Long no) {
        if (!noticeRepository.existsById(no)) return 0;
        noticeRepository.findById(no).ifPresent(n -> {
            if (n.getImage() != null) fileStorageService.delete(n.getImage());
        });
        noticeRepository.deleteById(no);
        return 1;
    }

    private NoticeVO toVO(Notice n) {
        NoticeVO vo = new NoticeVO();
        vo.setNoticeNo(n.getNoticeNo());
        vo.setTitle(n.getTitle());
        vo.setContent(n.getContent());
        vo.setFileName(n.getImage());

        // admin_no(Long) -> 화면에 보여줄 작성자 회원번호/이름으로 변환 (로그인 아이디는 노출하지 않는다)
        memberRepository.findById(n.getAdminNo()).ifPresentOrElse(writer -> {
            vo.setWriterNo(writer.getNo());
            vo.setWriterName(writer.getName());
        }, () -> {
            vo.setWriterNo(null);
            vo.setWriterName("알 수 없음");
        });

        vo.setCateNo(n.getCateNo());
        // cate_no -> notice_cate 테이블에서 실제 이름 조회 (더 이상 하드코딩하지 않는다)
        vo.setCateName(noticeCateRepository.findById(n.getCateNo())
                .map(NoticeCate::getCateName).orElse("기타"));

        vo.setWriteDate(n.getWriteDate() == null ? null : n.getWriteDate().format(DATE_FMT));
        vo.setUpdateDate(n.getUpdateDate() == null ? null : n.getUpdateDate().format(DATE_FMT));
        vo.setHit(n.getHit());
        return vo;
    }

    private List<NoticeVO> toVOList(List<Notice> notices) {
        if (notices.isEmpty()) return new ArrayList<>();

        // 작성자(회원)와 카테고리명을 각각 한 번씩만 조회해서 N+1을 방지한다.
        List<Long> adminNos = notices.stream().map(Notice::getAdminNo).distinct().toList();
        Map<Long, Member> writerMap = new HashMap<>();
        for (Member m : memberRepository.findAllById(adminNos)) {
            writerMap.put(m.getNo(), m);
        }

        List<Integer> cateNos = notices.stream().map(Notice::getCateNo).distinct().toList();
        Map<Integer, String> cateNameMap = new HashMap<>();
        for (NoticeCate c : noticeCateRepository.findAllById(cateNos)) {
            cateNameMap.put(c.getNoticeCateNo(), c.getCateName());
        }

        List<NoticeVO> list = new ArrayList<>();
        for (Notice n : notices) {
            NoticeVO vo = new NoticeVO();
            vo.setNoticeNo(n.getNoticeNo());
            vo.setTitle(n.getTitle());
            vo.setContent(n.getContent());
            vo.setFileName(n.getImage());

            Member writer = writerMap.get(n.getAdminNo());
            if (writer != null) {
                vo.setWriterNo(writer.getNo());
                vo.setWriterName(writer.getName());
            } else {
                vo.setWriterNo(null);
                vo.setWriterName("알 수 없음");
            }

            vo.setCateNo(n.getCateNo());
            vo.setCateName(cateNameMap.getOrDefault(n.getCateNo(), "기타"));

            vo.setWriteDate(n.getWriteDate() == null ? null : n.getWriteDate().format(DATE_FMT));
            vo.setUpdateDate(n.getUpdateDate() == null ? null : n.getUpdateDate().format(DATE_FMT));
            vo.setHit(n.getHit());
            list.add(vo);
        }
        return list;
    }
}
