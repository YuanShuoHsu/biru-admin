// https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error

"use client";

import { LocaleEnum } from "@/enums/Locale";

import common from "@/messages/zh-TW/common.json";

const GlobalError = ({ retry }: { error: unknown; retry: () => void }) => (
  <html lang={LocaleEnum.ZhTW}>
    <body>
      <title>{common.error.title}</title>
      <h2>{common.error.title}</h2>
      <p>{common.error.description}</p>
      <button onClick={() => retry()}>{common.error.retry}</button>
    </body>
  </html>
);

export default GlobalError;
