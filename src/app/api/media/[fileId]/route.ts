// src/app/api/media/[fileId]/route.ts
import { NextResponse } from "next/server";
import { imagekitServer } from "@/utils/imagekit-server";

export async function GET(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  if (!params.fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    const details = await new Promise((resolve, reject) => {
      imagekitServer.getFileDetails(params.fileId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    return NextResponse.json(details);
  } catch (err) {
    console.error("ImageKit fetch failed:", err);
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
}
