/**
 * 用隱藏 iframe 印出一段 HTML。
 *
 * 綠界的列印頁禁止跨網域嵌入，且跨來源碰不到 contentWindow.print()；
 * srcdoc 的文件與呼叫端同源，才印得動。
 */
export const printDocument = (html: string) => {
  const frame = document.createElement("iframe");

  // display: none 的 iframe 不會排版，印出來是空白；只能移到畫面外
  frame.style.border = "0";
  frame.style.bottom = "0";
  frame.style.height = "0";
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.width = "0";

  // srcdoc 要在掛上去之前設好，否則會先觸發一次 about:blank 的 load 印出空白
  frame.onload = () => frame.contentWindow?.print();
  frame.srcdoc = html;
  document.body.appendChild(frame);

  // 給列印對話框足夠時間再移除
  window.setTimeout(() => frame.remove(), 60_000);
};
