package com.everytable.api.store.repository;

import com.everytable.api.store.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    Optional<Store> findByOwnerNo(Long ownerNo);

    List<Store> findAllByOwnerNo(Long ownerNo);

    // store_cate가 FK(Integer)로 바뀌어 더 이상 Containing으로 검색할 수 없어,
    // 카테고리 이름(store_cate 테이블 조인) 매칭까지 포함한 JPQL로 대체.
    @Query("select s from Store s where s.storeName like %:word% or s.storeAddr like %:word% " +
            "or s.storeCateNo in (select c.storeCateNo from StoreCate c where c.cateName like %:word%)")
    Page<Store> search(@Param("word") String word, Pageable pageable);

    // stats 도메인 관리자 카테고리/지역 필터용
    List<Store> findByStoreCateNo(Integer storeCateNo);
    List<Store> findByStoreAddrContaining(String region);
    List<Store> findByStoreCateNoAndStoreAddrContaining(Integer storeCateNo, String region);
}