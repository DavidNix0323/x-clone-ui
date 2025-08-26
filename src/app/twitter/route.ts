import { NextResponse } from "next/server";

export async function GET() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;

  const res = await fetch(
    "https://api.twitter.com/2/users/by/username/DNixed0323?user.fields=id",
    {
      headers: { Authorization: `Bearer ${bearerToken}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
