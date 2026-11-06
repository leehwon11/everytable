package com.everytable.api.util.page;

import jakarta.servlet.http.HttpServletRequest;

import java.net.URLEncoder;

/**
 * 원본 everytable.util.page.PageObject 를 그대로 이식.
 * 리스트 화면 페이지네이션 + 검색(key/word) 처리를 위한 객체.
 */
public class PageObject {

    private long page;
    private long perPageNum;
    private long startRow, endRow;

    private long perGroupPageNum;
    private long startPage;
    private long endPage;
    private long totalPage;
    private long totalRow;

    private String key;
    private String word;

    public PageObject() {
        this.page = 1;
        this.perPageNum = 10;
        this.startRow = 1;
        this.endRow = 10;
        this.startPage = 1;
        this.endPage = 1;
        this.perGroupPageNum = 10;
    }

    public static PageObject getInstance(HttpServletRequest request) {
        PageObject pageObject = new PageObject();
        String strPage = request.getParameter("page");
        if (strPage != null && !strPage.isEmpty()) pageObject.setPage(Long.parseLong(strPage));
        String strPerPageNum = request.getParameter("perPageNum");
        if (strPerPageNum != null && !strPerPageNum.isEmpty()) pageObject.setPerPageNum(Long.parseLong(strPerPageNum));
        pageObject.setKey(request.getParameter("key"));
        pageObject.setWord(request.getParameter("word"));
        return pageObject;
    }

    public long getPage() { return page; }
    public void setPage(long page) { this.page = page; }
    public long getPerPageNum() { return perPageNum; }
    public void setPerPageNum(long perPageNum) { this.perPageNum = perPageNum; }
    public long getStartRow() { return startRow; }
    public long getEndRow() { return endRow; }
    public long getPerGroupPageNum() { return perGroupPageNum; }
    public void setPerGroupPageNum(long perGroupPageNum) { this.perGroupPageNum = perGroupPageNum; }
    public long getStartPage() { return startPage; }
    public long getEndPage() { return endPage; }
    public long getTotalPage() { return totalPage; }
    public long getTotalRow() { return totalRow; }

    // 목록 서비스에서 전체 건수를 구한 뒤 반드시 호출해야 페이지 계산이 완료된다.
    public void setTotalRow(long totalRow) {
        this.totalRow = totalRow;
        startRow = (page - 1) * perPageNum + 1;
        endRow = startRow + perPageNum - 1;
        totalPage = (totalRow - 1) / perPageNum + 1;
        startPage = (page - 1) / perGroupPageNum * perGroupPageNum + 1;
        endPage = startPage + perGroupPageNum - 1;
        if (endPage > totalPage) endPage = totalPage;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getWord() { return word; }
    public void setWord(String word) { this.word = word; }

    // MariaDB LIMIT/OFFSET 계산용
    public long getLimit() { return (page - 1) * perPageNum; }

    public String getNotPageQuery() {
        return "perPageNum=" + getPerPageNum()
                + "&key=" + (getKey() == null ? "" : getKey())
                + "&word=" + (getWord() == null ? "" : URLEncoder.encode(getWord(), java.nio.charset.StandardCharsets.UTF_8));
    }

    public String getPageQuery() {
        return "page=" + getPage() + "&" + getNotPageQuery();
    }

    @Override
    public String toString() {
        return "PageObject [page=" + page + ", perPageNum=" + perPageNum + ", startRow=" + startRow
                + ", endRow=" + endRow + ", totalPage=" + totalPage + ", totalRow=" + totalRow
                + ", key=" + key + ", word=" + word + "]";
    }
}
