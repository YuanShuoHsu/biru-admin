/**
 * 用隱藏 iframe 印出一段 HTML。
 *
 * 綠界的列印頁禁止跨網域嵌入，且跨來源碰不到 contentWindow.print()；
 * srcdoc 的文件與呼叫端同源，才印得動。
 */
export const printDocument = (html: string) =>
  new Promise<void>((resolve) => {
    const frame = document.createElement("iframe");

    // display: none 的 iframe 不會排版，印出來是空白；只能移到畫面外
    frame.style.border = "0";
    frame.style.bottom = "0";
    frame.style.height = "0";
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.width = "0";

    // 與後台同源，加 allow-scripts 等於讓綠界的 HTML 在後台網域執行腳本
    frame.sandbox.add("allow-same-origin", "allow-modals");

    // srcdoc 要在掛上去之前設好，否則會先觸發一次 about:blank 的 load 印出空白
    frame.onload = () => {
      // 列印對話框按取消也會觸發 afterprint，分不出有沒有真的印出來
      frame.contentWindow?.addEventListener("afterprint", () => {
        frame.remove();
        resolve();
      });
      frame.contentWindow?.print();
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
