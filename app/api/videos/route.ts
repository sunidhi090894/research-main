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

    // Map CSV columns to our video format
    const videos = records.map((record: any, index: number) => ({
      id: index + 1,
      title: record.title || record.Title || "",
      url: record.url || record.Url || record.videoUrl || "",
      thumbnail: record.thumbnail || `/placeholder.svg?height=200&width=300&query=therapeutic kids video`,
      duration: record.duration || record.Duration || "0:00",
      views: record.viewCount || record.views || record.Views || "0",
      likes: record.likes || record.Likes || "0",
      channel: record.channelName || record.channel || record.Channel || "Unknown Channel",
      channelUrl: record.channelUrl || record.ChannelUrl || "",
      subscribers: record.numberOfSubscribers || record.subscribers || "0",
      date: record.date || record.Date || record.publishedAt || "",
      keywords: extractKeywords(record.title || ""),
      description: record.description || record.Description || "",
      // Therapeutic categorization
      therapeuticCategory: detectTherapeuticCategory(record.title || "", record.description || ""),
      ageGroup: extractAgeGroup((record.title || "") + " " + (record.description || "")),
      difficulty: assessDifficulty(record.title || "", record.description || ""),
    }))

    return NextResponse.json({ videos, total: videos.length })
  } catch (error) {
    console.error("Error loading dataset:", error)
    return NextResponse.json({ error: "Failed to load dataset" }, { status: 500 })
  }
}

function extractKeywords(title: string): string[] {
  const therapeuticTerms = [
    "adhd",
    "autism",
    "anxiety",
    "focus",
    "attention",
    "concentration",
    "mindfulness",
    "therapy",
    "behavioral",
    "emotional",
    "sensory",
    "cognitive",
    "social skills",
    "memory",
    "breathing",
    "calming",
    "relaxation",
    "meditation",
    "yoga",
    "exercise",
    "learning",
  ]

  const titleLower = title.toLowerCase()
  return therapeuticTerms.filter((term) => titleLower.includes(term))
}

function detectTherapeuticCategory(title: string, description: string): string {
  const combined = (title + " " + description).toLowerCase()

  if (combined.includes("adhd") || combined.includes("attention") || combined.includes("focus")) return "attention"
  if (combined.includes("anxiety") || combined.includes("emotional") || combined.includes("mood")) return "emotional"
  if (combined.includes("memory") || combined.includes("cognitive") || combined.includes("brain")) return "cognitive"
  if (combined.includes("social") || combined.includes("autism") || combined.includes("communication")) return "social"
  if (combined.includes("sensory") || combined.includes("yoga") || combined.includes("movement")) return "physical"
  return "general"
}

function extractAgeGroup(text: string): string {
  const agePatternsMap = {
    "2-5": /toddler|preschool|2-5|ages 2|ages 3|ages 4|ages 5/i,
    "5-8": /kindergarten|5-8|ages 5|ages 6|ages 7|ages 8/i,
    "8-12": /elementary|8-12|ages 8|ages 9|ages 10|ages 11|ages 12/i,
    "12+": /teen|adolescent|12\+|ages 12|ages 13|ages 14|ages 15/i,
  }

  for (const [range, pattern] of Object.entries(agePatternsMap)) {
    if (pattern.test(text)) return range
  }
  return "5-12"
}

function assessDifficulty(title: string, description: string): string {
  const combined = (title + " " + description).toLowerCase()

  if (combined.includes("advanced") || combined.includes("complex") || combined.includes("intermediate"))
    return "intermediate"
  if (combined.includes("beginner") || combined.includes("simple") || combined.includes("basic")) return "beginner"
  return "beginner"
}
