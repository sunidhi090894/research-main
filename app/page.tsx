"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Play, Eye, ThumbsUp, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

function levenshteinDistance(str1: string, str2: string): number {
  if (str1.length === 0) return str2.length
  if (str2.length === 0) return str1.length

  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
      }
    }
  }

  return matrix[str2.length][str1.length]
}

function fuzzySearch(query: string, videos: any[]): any[] {
  if (!query.trim()) return videos.slice(0, 50) // Limit initial results for performance

  const queryLower = query.toLowerCase()
  const results = []

  for (let i = 0; i < videos.length && results.length < 100; i++) {
    const video = videos[i]
    let maxScore = 0

    // Quick exact match check first (fastest)
    if (video.title.toLowerCase().includes(queryLower)) {
      maxScore = 0.9
    } else if (video.channel.toLowerCase().includes(queryLower)) {
      maxScore = 0.7
    } else {
      // Only do expensive fuzzy matching if no exact match
      const titleScore =
        1 - levenshteinDistance(queryLower, video.title.toLowerCase()) / Math.max(queryLower.length, video.title.length)
      maxScore = Math.max(maxScore, titleScore)

      if (maxScore < 0.3) continue // Early termination for poor matches
    }

    if (maxScore > 0.3) {
      results.push({ ...video, score: maxScore })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

function VideoPlayer({ video, onClose }: { video: any; onClose: () => void }) {
  if (!video) return null

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const videoId = getYouTubeVideoId(video.url)
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold line-clamp-1">{video.title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="aspect-video">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <p className="text-muted-foreground">Video cannot be played</p>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-2">{video.channel}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {video.views} views
            </div>
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              {video.likes} likes
            </div>
            <span>{video.duration}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecommendationSystem() {
  const [videoDatabase, setVideoDatabase] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [error, setError] = useState<string>("")

  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredVideos = useMemo(() => {
    return fuzzySearch(debouncedQuery, videoDatabase)
  }, [debouncedQuery, videoDatabase])

  const loadDatasetFromBackend = useCallback(async () => {
    setIsLoading(true)
    setError("")

    try {
      console.log("[v0] Testing API connection...")

      // First test if API is working at all
      const testResponse = await fetch("/api/test")
      if (!testResponse.ok) {
        throw new Error("API server is not responding")
      }

      console.log("[v0] API test successful, loading dataset...")

      // Now try to load the actual dataset
      const response = await fetch("/api/videos")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API response error:", response.status, errorText)
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()

      if (!data.videos || !Array.isArray(data.videos)) {
        throw new Error("Invalid data format received from server")
      }

      console.log("[v0] Loaded dataset from backend:", data.videos.length, "videos")
      setVideoDatabase(data.videos)
      setSearchQuery("")
    } catch (error) {
      console.error("[v0] Error loading dataset:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Failed to load dataset: ${errorMessage}`)
      setVideoDatabase([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDatasetFromBackend()
  }, [loadDatasetFromBackend])

  const formatViews = useCallback((views: string | number) => {
    const num = typeof views === "string" ? Number.parseInt(views) || 0 : views
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }, [])

  const getYouTubeThumbnail = useCallback((url: string) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
    const match = url.match(regex)
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    }
    return "/video-thumbnail.png"
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <h1 className="text-xl font-bold">KidsVideoHub</h1>
            </div>

            <div className="flex-1 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search videos for children..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadDatasetFromBackend} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Reload Dataset"
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-destructive mb-2">Error Loading Dataset</h3>
            <p className="text-sm text-destructive/80 mb-3">{error}</p>
            <div className="text-xs text-muted-foreground">
              <p>Please ensure:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>
                  Your CSV file is placed at: <code>data/youtube_dataset.csv</code>
                </li>
                <li>The CSV file has the correct format with headers</li>
                <li>The file is not corrupted or too large</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={loadDatasetFromBackend} className="mt-3 bg-transparent">
              Try Again
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground text-lg">Loading videos from dataset...</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {searchQuery && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Search Results for "{searchQuery}"</h2>
                <p className="text-muted-foreground">Found {filteredVideos.length} videos matching your search</p>
              </div>
            )}

            {!searchQuery && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">All Videos</h2>
                <p className="text-muted-foreground">Showing {filteredVideos.length} videos from your dataset</p>
              </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className="group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedVideo(video)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={getYouTubeThumbnail(video.url) || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/video-thumbnail.png"
                        }}
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>

                      <p className="text-xs text-muted-foreground mb-2">{video.channel}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViews(video.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {formatViews(video.likes)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVideos.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">No videos found matching your search.</p>
                <p className="text-muted-foreground text-sm mt-2">Try different search terms.</p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedVideo && <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </div>
  )
}
