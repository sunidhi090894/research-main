import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { execFileSync } from "child_process"

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

    // Prepare videos array from CSV records
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
      // keep original row for flexibility and server-side inference
      __original: record,
    }))

    // Server-side inference: use subtitles column when available and call Python wrapper
    try {
      const subtitlesList = records.map((r: any) => {
        return (
          r.subtitles || r.Subtitles || r.transcript || r.Transcript || r.description || r.Description || ""
        )
      })

      // Call the Python inference script in research/infer_emotion.py
      // Pass the subtitles array as JSON via stdin and expect JSON array of labels back
      const scriptPath = path.join(process.cwd(), "research", "infer_emotion.py")
      const python = process.env.PYTHON || "python3"
      const resultBuffer = execFileSync(python, [scriptPath], {
        input: JSON.stringify(subtitlesList),
        maxBuffer: 10 * 1024 * 1024, // 10MB
      })
      const out = resultBuffer.toString("utf-8").trim()
      let labels: any[] = []
      try {
        labels = JSON.parse(out)
      } catch (err) {
        console.error("Failed to parse labels from Python script:", out)
      }

      // Attach labels to videos
      videos.forEach((v: any, i: number) => {
        const label = labels[i] || "neutral"
        v.emotion_label = String(label)
        v.healthCategories = [String(label).toUpperCase()]
      })
    } catch (err) {
      // If python call fails, fallback: leave videos without emotion labels
      console.error("Python inference failed:", err)
    }

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
