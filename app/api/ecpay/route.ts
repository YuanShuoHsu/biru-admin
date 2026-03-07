import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const base = process.env.NEXT_PUBLIC_NEST_URL;
    const { pathname } = new URL(request.url);
    const body = await request.json();

    const res = await fetch(`${base}${pathname}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();

    return NextResponse.json({ data }, { status: res.status });
  } catch (error) {
    console.error("ecpay proxy error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
