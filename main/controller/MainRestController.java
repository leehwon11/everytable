package com.everytable.api.main.controller;

import com.everytable.api.store.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 원본 everytable.main.controller.mainController 이식.
 * 원본은 main.jsp 로 포워드만 했는데(공지/추천매장 등은 notice/store 도메인에서 별도 처리),
 * REST 구조에서는 프론트가 필요한 데이터를 각 도메인 API(/store/list.do 등)에서 직접 가져오므로
 * 이 컨트롤러는 간단한 헬스체크/버전 정보만 제공한다.
 */
@RestController
@RequestMapping("/main")
@RequiredArgsConstructor
public class MainRestController {

    private static final int TOP_STORE_LIMIT = 8;

    private final StoreService storeService;

    @GetMapping("/main.do")
    public Map<String, Object> main() {
        // 메인화면에는 이번달 주문(예약) 건수가 많은 상위 매장을 보여준다 (취소 건 제외)
        return Map.of(
                "status", "ok",
                "stores", storeService.listTopMonthly(TOP_STORE_LIMIT)
        );
    }
}
