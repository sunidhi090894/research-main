import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("[v0] Starting dataset loading...")

    // Path to your CSV dataset file
    const csvPath = path.join(process.cwd(), "data", "youtube_dataset.csv")
    console.log("[v0] CSV path:", csvPath)

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.log("[v0] Dataset file not found at:", csvPath)
      return NextResponse.json({ error: "Dataset file not found" }, { status: 404 })
    }

    console.log("[v0] File exists, reading CSV content...")

    // Read CSV file with error handling
    let csvContent: string
    try {
      csvContent = fs.readFileSync(csvPath, "utf-8")
      console.log("[v0] CSV content length:", csvContent.length)
    } catch (fileError) {
      console.error("[v0] Error reading CSV file:", fileError)
      return NextResponse.json({ error: "Error reading CSV file" }, { status: 500 })
    }

    // Parse CSV manually without external library
    let records: any[]
    try {
      const lines = csvContent.split("\n").filter((line) => line.trim())
      console.log("[v0] Total lines:", lines.length)

      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV file appears to be empty or invalid" }, { status: 400 })
      }

      // Get headers from first line
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      console.log("[v0] Headers:", headers)

      // Parse data rows (limit to first 500 for performance)
      records = lines
        .slice(1, 501)
        .map((line, index) => {
          try {
            const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
            const record: any = {}

            headers.forEach((header, i) => {
              record[header] = values[i] || ""
            })

            return record
          } catch (lineError) {
            console.error("[v0] Error parsing line:", index, lineError)
            return null
          }
        })
        .filter(Boolean)

      console.log("[v0] Parsed records count:", records.length)
      if (records.length > 0) {
        console.log("[v0] First record:", records[0])
      }
    } catch (parseError) {
      console.error("[v0] Error parsing CSV:", parseError)
      return NextResponse.json({ error: "Error parsing CSV file" }, { status: 500 })
    }

    // Process records with error handling
    let videos: any[]
    try {
      videos = records
        .map((record: any, index: number) => {
          try {
            return {
              id: index + 1,
              title: record.title || record.Title || "",
              url: record.url || record.Url || record.videoUrl || "",
              thumbnail: record.thumbnail || "",
              duration: record.duration || record.Duration || "0:00",
              views: record.viewCount || record.views || record.Views || "0",
              likes: record.likes || record.Likes || "0",
              channel: record.channelName || record.channel || record.Channel || "Unknown Channel",
              channelUrl: record.channelUrl || record.ChannelUrl || "",
              subscribers: record.numberOfSubscribers || record.subscribers || "0",
              date: record.date || record.Date || record.publishedAt || "",
              keywords: extractKeywords(record.title || ""),
              description: record.description || record.Description || "",
              category: inferCategory(record.title || ""),
            }
          } catch (recordError) {
            console.error("[v0] Error processing record:", index, recordError)
            return null
          }
        })
        .filter(Boolean)

      console.log("[v0] Processed videos count:", videos.length)
    } catch (processingError) {
      console.error("[v0] Error processing records:", processingError)
      return NextResponse.json({ error: "Error processing video records" }, { status: 500 })
    }

    return NextResponse.json({ videos, total: videos.length })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}

function extractKeywords(title: string): string[] {
  if (!title) return []

  const commonWords = [
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "a",
    "an",
    "is",
    "are",
    "was",
    "were",
  ]

  const words = title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word))
    .slice(0, 5)

  return words
}

function inferCategory(title: string): string {
  if (!title) return "general"

  const text = title.toLowerCase()

  if (
    text.includes("learning") ||
    text.includes("alphabet") ||
    text.includes("numbers") ||
    text.includes("phonics") ||
    text.includes("attention") ||
    text.includes("educational") ||
    text.includes("abc") ||
    text.includes("counting") ||
    text.includes("math") ||
    text.includes("reading") ||
    text.includes("cognitive") ||
    text.includes("development") ||
    text.includes("concentration") ||
    text.includes("focus") ||
    text.includes("memory")
  ) {
    return "cognitive and development"
  }

  if (
    text.includes("calming") ||
    text.includes("aggression") ||
    text.includes("emotional") ||
    text.includes("hyperactivity") ||
    text.includes("relaxing") ||
    text.includes("soothing") ||
    text.includes("anxiety") ||
    text.includes("stress") ||
    text.includes("mindfulness") ||
    text.includes("meditation") ||
    text.includes("behavioral") ||
    text.includes("social") ||
    text.includes("empathy") ||
    text.includes("feelings") ||
    text.includes("mood")
  ) {
    return "behavioral and emotional"
  }

  return "general"
}
