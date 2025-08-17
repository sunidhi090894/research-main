"use client"

import { useState, useEffect } from "react"
import { Search, Play, Eye, ThumbsUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample video data with keywords
const videoDatabase = [
  {
    id: 1,
    title: "ABC Song for Kids | Learn Alphabets",
    thumbnail: "/colorful-alphabet-letters.png",
    duration: "3:45",
    views: "2.5M",
    likes: "45K",
    channel: "Kids Learning Hub",
    keywords: ["abc songs for kids", "learning alphabets for kids", "educational videos for toddlers", "phonics songs"],
    description: "Fun and colorful ABC song to help children learn the alphabet",
  },
  {
    id: 2,
    title: "Peppa Pig - Muddy Puddles Episode",
    thumbnail: "/peppa-pig-muddy-puddles.png",
    duration: "5:12",
    views: "8.9M",
    likes: "120K",
    channel: "Peppa Pig Official",
    keywords: ["peppa pig", "cartoon for kids", "kids cartoons", "animated stories for kids"],
    description: "Peppa and George love jumping in muddy puddles!",
  },
  {
    id: 3,
    title: "CoComelon - Wheels on the Bus",
    thumbnail: "/colorful-bus-animation.png",
    duration: "2:58",
    views: "15.2M",
    likes: "280K",
    channel: "CoComelon Nursery Rhymes",
    keywords: ["cocomelon", "nursery rhymes", "children songs", "baby songs", "toddler songs"],
    description: "Sing along with the classic Wheels on the Bus nursery rhyme",
  },
  {
    id: 4,
    title: "Numbers Song 1-10 for Children",
    thumbnail: "/colorful-numbers-learning.png",
    duration: "4:23",
    views: "3.8M",
    likes: "67K",
    channel: "Learning Station",
    keywords: [
      "numbers song for children",
      "kids learning videos",
      "educational videos for toddlers",
      "kindergarten learning videos",
    ],
    description: "Learn to count from 1 to 10 with this fun animated song",
  },
  {
    id: 5,
    title: "Bedtime Stories - The Three Little Pigs",
    thumbnail: "/three-little-pigs-bedtime.png",
    duration: "8:15",
    views: "1.9M",
    likes: "32K",
    channel: "Storytime Kids",
    keywords: ["bedtime stories for children", "animated stories for kids", "kids educational shows"],
    description: "A classic bedtime story beautifully animated for children",
  },
  {
    id: 6,
    title: "Kids Dance Party - Fun Movement Songs",
    thumbnail: "/colorful-kids-party.png",
    duration: "6:30",
    views: "4.7M",
    likes: "89K",
    channel: "Dance Kids TV",
    keywords: ["kids dance songs", "children songs", "toddler songs", "preschool learning videos"],
    description: "Get moving with these fun dance songs for kids",
  },
  {
    id: 7,
    title: "Phonics Song - Letter Sounds A-Z",
    thumbnail: "/colorful-phonics-alphabet.png",
    duration: "5:45",
    views: "6.1M",
    likes: "112K",
    channel: "Phonics Fun",
    keywords: ["phonics songs", "learning alphabets for kids", "abc songs for kids", "educational videos for toddlers"],
    description: "Learn letter sounds with this engaging phonics song",
  },
  {
    id: 8,
    title: "Baby Shark Dance | Kids Songs",
    thumbnail: "/baby-shark-underwater.png",
    duration: "2:17",
    views: "12.8M",
    likes: "195K",
    channel: "Pinkfong Baby Shark",
    keywords: ["baby songs", "kids dance songs", "children songs", "nursery rhymes"],
    description: "The most popular kids song - Baby Shark dance!",
  },
]

const allKeywords = [
  "kids cartoons",
  "nursery rhymes",
  "cocomelon",
  "peppa pig",
  "children songs",
  "educational videos for toddlers",
  "kids learning videos",
  "baby songs",
  "cartoon for kids",
  "abc songs for kids",
  "numbers song for children",
  "learning alphabets for kids",
  "phonics songs",
  "bedtime stories for children",
  "animated stories for kids",
  "kids educational shows",
  "toddler songs",
  "kids dance songs",
  "kindergarten learning videos",
  "preschool learning videos",
]

// Fuzzy matching function using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
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

// Fuzzy search function
function fuzzySearch(query: string, videos: typeof videoDatabase): typeof videoDatabase {
  if (!query.trim()) return videos

  const queryLower = query.toLowerCase()

  return videos
    .map((video) => {
      let maxScore = 0

      // Check title similarity
      const titleScore =
        1 - levenshteinDistance(queryLower, video.title.toLowerCase()) / Math.max(queryLower.length, video.title.length)
      maxScore = Math.max(maxScore, titleScore)

      // Check keyword similarity
      video.keywords.forEach((keyword) => {
        const keywordScore =
          1 - levenshteinDistance(queryLower, keyword.toLowerCase()) / Math.max(queryLower.length, keyword.length)
        maxScore = Math.max(maxScore, keywordScore)

        // Also check if query is contained in keyword or vice versa
        if (keyword.toLowerCase().includes(queryLower) || queryLower.includes(keyword.toLowerCase())) {
          maxScore = Math.max(maxScore, 0.8)
        }
      })

      return { ...video, score: maxScore }
    })
    .filter((video) => video.score > 0.3) // Threshold for fuzzy matching
    .sort((a, b) => b.score - a.score)
}

export default function YouTubeRecommendationSystem() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredVideos, setFilteredVideos] = useState(videoDatabase)
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

  useEffect(() => {
    if (selectedKeyword) {
      const keywordFiltered = videoDatabase.filter((video) =>
        video.keywords.some((keyword) => keyword.toLowerCase().includes(selectedKeyword.toLowerCase())),
      )
      setFilteredVideos(keywordFiltered)
    } else {
      const results = fuzzySearch(searchQuery, videoDatabase)
      setFilteredVideos(results)
    }
  }, [searchQuery, selectedKeyword])

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(selectedKeyword === keyword ? null : keyword)
    setSearchQuery("")
  }

  const formatViews = (views: string) => views
  const formatDuration = (duration: string) => duration

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <h1 className="text-xl font-bold">KidsVids</h1>
            </div>

            <div className="flex-1 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search for kids videos..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedKeyword(null)
                  }}
                  className="pl-10 pr-4"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Keyword Tags */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Popular Categories</h2>
          <div className="flex flex-wrap gap-2">
            {allKeywords.map((keyword) => (
              <Badge
                key={keyword}
                variant={selectedKeyword === keyword ? "default" : "secondary"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => handleKeywordClick(keyword)}
              >
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {selectedKeyword
              ? `Showing videos for "${selectedKeyword}"`
              : searchQuery
                ? `Search results for "${searchQuery}"`
                : "Recommended for you"}{" "}
            ({filteredVideos.length} videos)
          </p>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg flex items-center justify-center">
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
                      {video.likes}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {video.keywords.slice(0, 2).map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No videos found matching your search.</p>
            <p className="text-muted-foreground text-sm mt-2">Try different keywords or browse our categories above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
