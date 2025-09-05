"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CSVUploaderProps {
  onDataLoaded: (data: any[]) => void
  expectedColumns?: string[]
}

export function CSVUploader({ onDataLoaded, expectedColumns }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row")

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        data.push(row)
      }
    }

    return data
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const data = parseCSV(text)

      if (data.length === 0) {
        throw new Error("No valid data rows found in CSV")
      }

      const videoData = data.map((row, index) => ({
        id: index + 1,
        title: row.title || row.Title || row.name || row.Name || `Video ${index + 1}`,
        thumbnail: row.thumbnail || row.Thumbnail || row.image || row.Image || "/therapeutic-kids-video.png",
        duration: row.duration || row.Duration || row.length || "3:00",
        views: row.viewCount || row.views || row.Views || "1K",
        likes: row.likes || row.Likes || row.likeCount || "10",
        channel: row.channelName || row.channel || row.Channel || row.creator || row.Creator || "Therapy Channel",
        url: row.url || row.Url || row.link || row.Link || "#",
        date: row.date || row.Date || row.publishedAt || new Date().toISOString(),
        channelUrl: row.channelUrl || row.ChannelUrl || "#",
        numberOfSubscribers: row.numberOfSubscribers || row.subscribers || "1K",
        keywords: (row.keywords || row.Keywords || row.tags || row.Tags || "therapeutic,kids,wellness")
          .split(",")
          .map((k: string) => k.trim())
          .filter((k: string) => k.length > 0),
        description:
          row.description ||
          row.Description ||
          row.summary ||
          row.Summary ||
          "Therapeutic video for children's wellness",
        category: inferCategory(row.title, row.description),
        // Include all original CSV columns for flexibility
        ...row,
      }))

      onDataLoaded(videoData)
      setUploadedFile(file)
      console.log("[v0] Therapeutic CSV processed successfully:", videoData.length, "videos loaded")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process CSV file")
      console.error("[v0] CSV processing error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const csvFile = files.find((file) => file.type === "text/csv" || file.name.endsWith(".csv"))

    if (csvFile) {
      processFile(csvFile)
    } else {
      setError("Please upload a CSV file")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function inferCategory(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

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

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Upload Your Dataset</h3>
            {uploadedFile && (
              <Button variant="outline" size="sm" onClick={clearFile}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {!uploadedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragging ? "Drop your CSV file here" : "Upload your video dataset"}
              </p>
              <p className="text-muted-foreground mb-4">Drag and drop a CSV file or click to browse</p>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Choose File"}
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Badge variant="secondary">Loaded</Badge>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">Error: {error}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Expected CSV columns for YouTube dataset:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "title",
                "url",
                "viewCount",
                "date",
                "likes",
                "channelName",
                "channelUrl",
                "numberOfSubscribers",
                "duration",
                "description/keywords",
              ].map((col) => (
                <Badge key={col} variant="outline" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
            <p className="text-xs mt-2">
              The system will automatically process your YouTube dataset and apply therapeutic categorization based on
              content analysis.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
