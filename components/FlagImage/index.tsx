import type { CountryCode } from "libphonenumber-js";
import Image from "next/image";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(2.5),
  height: theme.spacing(2.5),
  flexShrink: 0,
  overflow: "hidden",
}));

const FlagImage = ({ code, label }: { code: CountryCode; label: string }) => (
  <ImageBox>
    <Image
      alt={label}
      fill
      loading="lazy"
      sizes="(min-width: 808px) 50vw, 100vw"
      src={`/images/flags/w20/${code.toLowerCase()}.png`}
      style={{ objectFit: "contain" }}
      unoptimized
    />
  </ImageBox>
);

export default FlagImage;
