import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

export async function GET() {
  try {
    // Path to your CSV dataset file
    const csvPath = path.join(process.cwd(), "data", "youtube_dataset.csv")

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: "Dataset file not found" }, { status: 404 })
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, "utf-8")
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const videos = records.map((record: any, index: number) => ({
      id: index + 1,
      title: record.title || record.Title || "",
      url: record.url || record.Url || record.videoUrl || "",
      thumbnail: record.thumbnail || "", // Will use YouTube thumbnail extraction
      duration: record.duration || record.Duration || "0:00",
      views: record.viewCount || record.views || record.Views || "0",
      likes: record.likes || record.Likes || "0",
      channel: record.channelName || record.channel || record.Channel || "Unknown Channel",
      channelUrl: record.channelUrl || record.ChannelUrl || "",
      subscribers: record.numberOfSubscribers || record.subscribers || "0",
      date: record.date || record.Date || record.publishedAt || "",
      keywords: extractKeywords(record.title || ""),
      description: record.description || record.Description || "",
    }))

    return NextResponse.json({ videos, total: videos.length })
  } catch (error) {
    console.error("Error loading dataset:", error)
    return NextResponse.json({ error: "Failed to load dataset" }, { status: 500 })
  }
}

function extractKeywords(title: string): string[] {
  // Extract meaningful words from title (remove common words)
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
    .slice(0, 5) // Limit to 5 keywords

  return words
}
