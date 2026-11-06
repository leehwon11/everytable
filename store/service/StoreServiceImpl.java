package com.everytable.api.store.service;

import com.everytable.api.member.entity.Member;
import com.everytable.api.member.repository.MemberRepository;
import com.everytable.api.reservation.repository.ReservationRepositoryCustom;
import com.everytable.api.store.entity.Store;
import com.everytable.api.store.entity.StoreCate;
import com.everytable.api.store.repository.StoreCateRepository;
import com.everytable.api.store.repository.StoreRepository;
import com.everytable.api.store.vo.StoreVO;
import com.everytable.api.util.page.PageObject;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final StoreCateRepository storeCateRepository;
    private final MemberRepository memberRepository;
    private final ReservationRepositoryCustom reservationRepositoryCustom;

    @Override
    @Transactional
    public StoreVO write(StoreVO vo) {
        Store store = Store.builder()
                .ownerNo(vo.getOwnerNo())
                .storeName(vo.getStoreName())
                .storeCateNo(vo.getStoreCateNo())
                .storeAddr(vo.getStoreAddr())
                .storeTel(vo.getStoreTel())
                .openTime(vo.getOpenTime())
                .minOrderPrice(vo.getMinOrderPrice())
                .prepareTime(vo.getPrepareTime())
                .filename(vo.getFilename())
                .avgRating(0)
                .reviewCount(0)
                .refundPolicy24(vo.getRefundPolicy24())
                .refundPolicy12(vo.getRefundPolicy12())
                .refundPolicy0(vo.getRefundPolicy0())
                .build();
        return toVO(storeRepository.save(store));
    }

    @Override
    public StoreVO view(Long storeNo) {
        return storeRepository.findById(storeNo).map(this::toVO)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 매장입니다."));
    }

    @Override
    public StoreVO findByMemberId(String memberId) {
        return memberRepository.findByLoginId(memberId)
                .flatMap(m -> storeRepository.findByOwnerNo(m.getNo()))
                .map(this::toVO)
                .orElse(null);
    }

    @Override
    public List<StoreVO> myStores(Long ownerNo) {
        return toVOList(storeRepository.findAllByOwnerNo(ownerNo));
    }

    @Override
    public List<StoreVO> allStores() {
        return toVOList(storeRepository.findAll());
    }

    @Override
    @Transactional
    public int update(StoreVO vo) {
        Store store = storeRepository.findById(vo.getStoreNo())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 매장입니다."));
        store.setStoreName(vo.getStoreName());
        store.setStoreCateNo(vo.getStoreCateNo());
        store.setStoreAddr(vo.getStoreAddr());
        store.setStoreTel(vo.getStoreTel());
        store.setOpenTime(vo.getOpenTime());
        store.setMinOrderPrice(vo.getMinOrderPrice());
        store.setPrepareTime(vo.getPrepareTime());
        store.setRefundPolicy24(vo.getRefundPolicy24());
        store.setRefundPolicy12(vo.getRefundPolicy12());
        store.setRefundPolicy0(vo.getRefundPolicy0());
        if (vo.getFilename() != null && !vo.getFilename().isEmpty()) {
            store.setFilename(vo.getFilename());
        }
        storeRepository.save(store);
        return 1;
    }

    @Override
    public Map<String, Object> list(PageObject pageObject) {
        String word = pageObject.getWord() == null ? "" : pageObject.getWord();
        Page<Store> page = storeRepository.search(word,
                PageRequest.of((int) pageObject.getPage() - 1, (int) pageObject.getPerPageNum()));

        pageObject.setTotalRow(page.getTotalElements());

        Map<String, Object> result = new HashMap<>();
        result.put("list", toVOList(page.getContent()));
        result.put("pageObject", pageObject);
        return result;
    }

    @Override
    public Map<String, Object> listTopMonthly(int limit) {
        LocalDate today = LocalDate.now();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);

        List<Long> rankedStoreNos = reservationRepositoryCustom.topStoreNosByOrderCount(monthStart, monthEnd, limit);

        Map<Long, Store> byId = new LinkedHashMap<>();
        for (Store s : storeRepository.findAllById(rankedStoreNos)) {
            byId.put(s.getStoreNo(), s);
        }

        List<Store> ordered = new ArrayList<>();
        for (Long storeNo : rankedStoreNos) {
            Store s = byId.get(storeNo);
            if (s != null) ordered.add(s);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", toVOList(ordered));
        return result;
    }

    private StoreVO toVO(Store s) {
        StoreVO vo = new StoreVO();
        vo.setStoreNo(s.getStoreNo());
        vo.setOwnerNo(s.getOwnerNo());
        vo.setAvgRating(s.getAvgRating());
        vo.setReviewCount(s.getReviewCount());
        vo.setFilename(s.getFilename());
        vo.setStoreName(s.getStoreName());
        vo.setStoreCateNo(s.getStoreCateNo());
        vo.setStoreCateName(s.getStoreCateNo() == null ? null :
                storeCateRepository.findById(s.getStoreCateNo()).map(StoreCate::getCateName).orElse(null));
        vo.setStoreAddr(s.getStoreAddr());
        vo.setStoreTel(s.getStoreTel());
        vo.setOpenTime(s.getOpenTime());
        vo.setMinOrderPrice(s.getMinOrderPrice());
        vo.setPrepareTime(s.getPrepareTime());
        vo.setRefundPolicy24(s.getRefundPolicy24());
        vo.setRefundPolicy12(s.getRefundPolicy12());
        vo.setRefundPolicy0(s.getRefundPolicy0());
        return vo;
    }

    // 목록 조회용 배치 변환 (N+1 방지) - 매장 여러 개의 카테고리명을 한 번에 조회한다.
    private List<StoreVO> toVOList(List<Store> stores) {
        List<Integer> cateNos = stores.stream()
                .map(Store::getStoreCateNo).filter(java.util.Objects::nonNull).distinct().toList();
        Map<Integer, String> cateNameMap = new HashMap<>();
        for (StoreCate c : storeCateRepository.findAllById(cateNos)) {
            cateNameMap.put(c.getStoreCateNo(), c.getCateName());
        }

        List<StoreVO> list = new ArrayList<>();
        for (Store s : stores) {
            StoreVO vo = new StoreVO();
            vo.setStoreNo(s.getStoreNo());
            vo.setOwnerNo(s.getOwnerNo());
            vo.setAvgRating(s.getAvgRating());
            vo.setReviewCount(s.getReviewCount());
            vo.setFilename(s.getFilename());
            vo.setStoreName(s.getStoreName());
            vo.setStoreCateNo(s.getStoreCateNo());
            vo.setStoreCateName(cateNameMap.get(s.getStoreCateNo()));
            vo.setStoreAddr(s.getStoreAddr());
            vo.setStoreTel(s.getStoreTel());
            vo.setOpenTime(s.getOpenTime());
            vo.setMinOrderPrice(s.getMinOrderPrice());
            vo.setPrepareTime(s.getPrepareTime());
            vo.setRefundPolicy24(s.getRefundPolicy24());
            vo.setRefundPolicy12(s.getRefundPolicy12());
            vo.setRefundPolicy0(s.getRefundPolicy0());
            list.add(vo);
        }
        return list;
    }
}