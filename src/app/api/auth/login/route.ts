import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const base = process.env.NEXT_PUBLIC_NEST_API_URL;
    const { pathname } = new URL(request.url);
    const body = await request.json();

    const res = await fetch(`${base}${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // const contentType = res.headers.get("content-type") || "";

    // let data;
    // if (contentType.includes("application/json")) {
    //   data = await res.json();
    // } else {
    //   const text = await res.text();
    //   data = { message: text };
    // }

    const data = await res.text();

    return NextResponse.json({ data }, { status: res.status });
  } catch (error) {
    console.error("auth login proxy error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
