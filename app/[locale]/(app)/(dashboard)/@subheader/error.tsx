// https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes#loading-and-error-ui

"use client";

// 同一份資料頁面本身也會載入並顯示錯誤，這裡只要不讓錯誤冒到外層把整個外框換掉
const SubheaderError = () => null;

export default SubheaderError;
