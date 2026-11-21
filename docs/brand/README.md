# 品牌

碧露的 Logo、品牌故事與紙本菜單版型。

## 碧露的故事

碧露是我貓的名字，取自台語、日文的啤酒，希望能鏘鏘的可愛又好叫，帶來歡樂的氣氛。

碧露是小山前同事的朋友，在恆春路邊撿到的斷手貓媽媽生的小孩，她媽媽身上有各種顏色花紋，黑、黃、咖啡、白、虎斑夾雜，很壯有霸氣很像黑道老大。

碧露是天生容易緊張的貓貓，會跳到很高的櫃子上遠遠俯瞰周遭一切，除了主人以外都不給碰，抱抱只能十秒，但喜歡摸摸和拍屁屁很傲嬌，叫聲是「啊啊啊啊啊」，是很喜歡跟人講話的貓貓，會黏踢踢跟著主人身後的小跟班，特色是碧綠色的眼睛和臉上有一顆美人瘤，身上的毛很像兔毛一樣柔軟滑順。

## 店的初衷

店的初衷是希望提供一個舒適的空間、貼心的服務、美味的餐食，如果碧露喜歡，你一定也會喜歡的。

## Logo

![碧露 Logo](logo.svg)

| 項目     | 內容                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------- |
| 原稿     | [logo.jpg](logo.jpg)（1254×1254 JPG）                                                                |
| 向量檔   | [logo.svg](logo.svg)／[logo.pdf](logo.pdf)：貓與杯子加 Biru Coffee 字樣                              |
| 主圖     | [logo-mark.svg](logo-mark.svg)／[logo-mark.pdf](logo-mark.pdf)：貓與杯子                             |
| 文字標   | [wordmark.svg](wordmark.svg)／[wordmark.pdf](wordmark.pdf)：Biru Coffee                              |
| 單色版   | [logo-mono.svg](logo-mono.svg)／[logo-mono.pdf](logo-mono.pdf)：只用藍灰一色，餐具、紙杯等單色印刷用 |
| App 圖示 | [logo-icon.svg](logo-icon.svg)：藍灰圓角方底配奶泡白貓杯，給 favicon、PWA、社群頭像用                |
| 元素     | 咖啡、啤酒、貓（舉例：貓貓坐在啤酒奶泡上，尾巴是咖啡杯手柄）                                         |
| 風格     | 看起來簡約舒適，有點日系的風格，但還是要有咖啡廳的感覺                                               |

向量檔照原稿描製，對照見 [previews/logo-vector.png](previews/logo-vector.png)。SVG 給網頁與系統用；PDF 給印刷用，全為向量、文字已轉外框、色彩為 CMYK，可任意縮放。

彩色版的貓身與奶泡填滿奶泡白，只有杯子把手內側透明，放在任何底色上都一樣，見 [previews/logo-backgrounds.png](previews/logo-backgrounds.png)。

單色版與 App 圖示照原稿上的小圖簡化：虎斑整理成色塊與幾條斑紋，單色版的淺色部分挖空、不上墨。見 [previews/logo-variants.png](previews/logo-variants.png)。App 圖示在 32px 只看得出輪廓，做 favicon 時可能要再簡化；前台與後台的 favicon、PWA 圖示之後再替換。

### 配色

向量檔使用以下色彩。CMYK 以 FOGRA39（Coated）相對比色換算，正式色號以印刷廠的色彩描述檔為準。

貓身上的白色印奶泡白，不留紙白。

| 名稱     | RGB     | CMYK            | 用途                   |
| -------- | ------- | --------------- | ---------------------- |
| 藍灰     | #607A87 | C62 M36 Y31 K25 | 主色、輪廓、杯身、文字 |
| 奶泡白   | #FAF7F1 | C4 M3 Y7 K0     | 奶泡、貓身白色、背景   |
| 拿鐵琥珀 | #CE9C61 | C17 M40 Y67 K7  | 咖啡、點綴             |
| 虎斑棕   | #B29D86 | C33 M36 Y47 K6  | 貓毛                   |
| 斑紋深棕 | #6A645E | C58 M52 Y55 K30 | 虎斑                   |
| 斑紋深灰 | #504D4C | C67 M60 Y58 K45 | 虎斑暗部               |
| 耳朵粉   | #E2C6BA | C13 M26 Y27 K0  | 耳朵                   |
| 瞳孔青   | #7F9A98 | C53 M27 Y36 K10 | 眼睛                   |
| 眼鼻深藍 | #38444A | C80 M57 Y50 K55 | 瞳孔、鼻子、美人瘤     |
| 嘴巴粉   | #C9A39A | C22 M38 Y35 K5  | 嘴巴                   |
| 高光白   | #FFFFFF | C0 M0 Y0 K0     | 眼睛高光               |

## 紙本菜單

[menu.html](menu.html) 是 A4 紙本菜單的版型，用瀏覽器開啟後列印或另存 PDF。
目前的樣子見 [previews/menu.png](previews/menu.png)。

品項、價格與說明以系統菜單為準。正式的紙本菜單改由系統依這個版型直接產生 PDF（YuanShuoHsu/biru-api#569），這個檔案只是版型稿，目前的品項與價格取自 [recipes.md](../recipes.md)。
