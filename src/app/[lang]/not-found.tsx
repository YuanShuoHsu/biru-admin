// https://nextjs.org/docs/app/api-reference/file-conventions/not-found

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const NotFound = () => {
  const { lang } = useParams();

  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href={`/${lang}`}>Return Home</Link>
    </div>
  );
};

export default NotFound;
