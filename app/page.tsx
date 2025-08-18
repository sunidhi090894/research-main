"use client"

import { useState, useEffect } from "react"
import { Search, Play, Eye, ThumbsUp, Database, Brain, Heart, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const sampleVideoDatabase = [
  {
    id: 1,
    title: "Mindfulness for Kids - Focus and Attention Training",
    thumbnail: "/colorful-alphabet-letters.png",
    duration: "8:45",
    views: "1.2M",
    likes: "35K",
    channel: "Kids Mental Health Hub",
    keywords: [
      "mindfulness for kids",
      "attention training",
      "focus exercises",
      "concentration improvement",
      "calming activities",
    ],
    description: "Gentle mindfulness exercises to help children improve focus and attention span",
    therapeuticCategory: "attention",
    ageGroup: "5-12",
    difficulty: "beginner",
  },
  {
    id: 2,
    title: "Breathing Exercises for Anxious Children",
    thumbnail: "/peppa-pig-muddy-puddles.png",
    duration: "6:12",
    views: "2.1M",
    likes: "48K",
    channel: "Calm Kids Therapy",
    keywords: [
      "breathing exercises",
      "anxiety relief",
      "emotional regulation",
      "stress management",
      "calming techniques",
    ],
    description: "Simple breathing techniques to help children manage anxiety and improve emotional regulation",
    therapeuticCategory: "emotional",
    ageGroup: "4-10",
    difficulty: "beginner",
  },
  {
    id: 3,
    title: "Interactive Memory Games for ADHD Kids",
    thumbnail: "/colorful-bus-animation.png",
    duration: "12:30",
    views: "890K",
    likes: "22K",
    channel: "ADHD Support Center",
    keywords: ["memory games", "adhd support", "cognitive training", "working memory", "attention deficit"],
    description: "Engaging memory games designed specifically for children with ADHD",
    therapeuticCategory: "cognitive",
    ageGroup: "6-14",
    difficulty: "intermediate",
  },
  {
    id: 4,
    title: "Yoga for Kids - Concentration and Balance",
    thumbnail: "/colorful-numbers-learning.png",
    duration: "15:23",
    views: "1.5M",
    likes: "41K",
    channel: "Kids Yoga Studio",
    keywords: ["kids yoga", "balance exercises", "body awareness", "concentration improvement", "physical therapy"],
    description: "Gentle yoga poses to improve concentration, balance, and body awareness",
    therapeuticCategory: "physical",
    ageGroup: "5-12",
    difficulty: "beginner",
  },
  {
    id: 5,
    title: "Social Skills Stories for Autism Spectrum",
    thumbnail: "/three-little-pigs-bedtime.png",
    duration: "10:15",
    views: "750K",
    likes: "18K",
    channel: "Autism Family Support",
    keywords: ["social skills", "autism support", "communication skills", "behavioral therapy", "social stories"],
    description: "Interactive social stories to help children on the autism spectrum develop social skills",
    therapeuticCategory: "social",
    ageGroup: "4-12",
    difficulty: "beginner",
  },
  {
    id: 6,
    title: "Sensory Processing Activities for Kids",
    thumbnail: "/colorful-kids-party.png",
    duration: "9:30",
    views: "1.1M",
    likes: "28K",
    channel: "Sensory Kids Therapy",
    keywords: ["sensory processing", "sensory activities", "tactile stimulation", "proprioception", "vestibular input"],
    description: "Fun sensory activities to help children with sensory processing challenges",
    therapeuticCategory: "sensory",
    ageGroup: "3-10",
    difficulty: "beginner",
  },
]

const therapeuticKeywords = [
  // Attention & Focus
  "attention training",
  "focus exercises",
  "concentration improvement",
  "mindfulness for kids",
  "meditation for children",
  "attention deficit support",
  "adhd activities",
  "working memory games",

  // Emotional Regulation
  "emotional regulation",
  "anxiety relief",
  "stress management",
  "calming techniques",
  "breathing exercises",
  "emotional intelligence",
  "mood regulation",
  "self-soothing",

  // Cognitive Development
  "cognitive training",
  "memory games",
  "problem solving skills",
  "executive function",
  "brain training",
  "cognitive behavioral therapy",
  "thinking skills",
  "mental flexibility",

  // Social & Communication
  "social skills",
  "communication skills",
  "autism support",
  "social stories",
  "peer interaction",
  "friendship skills",
  "behavioral therapy",
  "social anxiety",

  // Physical & Sensory
  "sensory processing",
  "sensory activities",
  "kids yoga",
  "balance exercises",
  "motor skills",
  "body awareness",
  "proprioception",
  "vestibular input",

  // Sleep & Routine
  "sleep hygiene",
  "bedtime routine",
  "relaxation techniques",
  "sleep disorders",
  "calming activities",
  "transition activities",
  "routine building",
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

function therapeuticFuzzySearch(query: string, videos: any[]): any[] {
  if (!query.trim()) return videos

  const queryLower = query.toLowerCase()

  // Therapeutic keywords that get priority scoring
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
  ]

  return videos
    .map((video) => {
      let maxScore = 0
      let therapeuticBonus = 0

      // Check if query contains therapeutic terms
      const hasTherapeuticTerm = therapeuticTerms.some((term) => queryLower.includes(term) || term.includes(queryLower))

      // Title similarity with therapeutic bonus
      const titleScore =
        1 - levenshteinDistance(queryLower, video.title.toLowerCase()) / Math.max(queryLower.length, video.title.length)
      maxScore = Math.max(maxScore, titleScore)

      // Therapeutic category bonus
      if (video.therapeuticCategory && hasTherapeuticTerm) {
        therapeuticBonus += 0.3
      }

      // Enhanced keyword matching with therapeutic priority
      if (video.keywords && Array.isArray(video.keywords)) {
        video.keywords.forEach((keyword: string) => {
          const keywordScore =
            1 - levenshteinDistance(queryLower, keyword.toLowerCase()) / Math.max(queryLower.length, keyword.length)
          maxScore = Math.max(maxScore, keywordScore)

          // Exact or partial matches
          if (keyword.toLowerCase().includes(queryLower) || queryLower.includes(keyword.toLowerCase())) {
            maxScore = Math.max(maxScore, 0.8)
          }

          // Therapeutic keyword bonus
          if (therapeuticTerms.some((term) => keyword.toLowerCase().includes(term))) {
            therapeuticBonus += 0.2
          }
        })
      }

      // Age appropriateness bonus (if age info available)
      if (video.ageGroup && queryLower.includes("age")) {
        therapeuticBonus += 0.1
      }

      return { ...video, score: maxScore + therapeuticBonus }
    })
    .filter((video) => video.score > 0.25) // Slightly lower threshold for therapeutic content
    .sort((a, b) => b.score - a.score)
}

export default function TherapeuticRecommendationSystem() {
  const [videoDatabase, setVideoDatabase] = useState(sampleVideoDatabase)
  const [allKeywords, setAllKeywords] = useState(therapeuticKeywords)
  const [isUsingCustomData, setIsUsingCustomData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredVideos, setFilteredVideos] = useState(videoDatabase)
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const loadDatasetFromBackend = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/videos")
      if (!response.ok) {
        throw new Error("Failed to load dataset")
      }

      const data = await response.json()
      console.log("[v0] Loaded dataset from backend:", data.videos.length, "videos")

      setVideoDatabase(data.videos)
      setIsUsingCustomData(true)

      // Extract keywords from loaded data
      const extractedKeywords = new Set<string>()
      data.videos.forEach((video: any) => {
        if (video.keywords && Array.isArray(video.keywords)) {
          video.keywords.forEach((keyword: string) => {
            if (keyword && keyword.trim()) {
              extractedKeywords.add(keyword.trim().toLowerCase())
            }
          })
        }
      })

      const newKeywords = Array.from(extractedKeywords)
      setAllKeywords(newKeywords.length > 0 ? [...therapeuticKeywords, ...newKeywords] : therapeuticKeywords)
      setSelectedKeyword(null)
      setSearchQuery("")
    } catch (error) {
      console.error("Error loading dataset:", error)
      alert("Failed to load dataset. Please check if the CSV file exists in the data folder.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDatasetFromBackend()
  }, [])

  const detectTherapeuticCategory = (title: string, keywords: any) => {
    const titleLower = title.toLowerCase()
    const keywordStr = Array.isArray(keywords) ? keywords.join(" ").toLowerCase() : ""
    const combined = titleLower + " " + keywordStr

    if (combined.includes("adhd") || combined.includes("attention") || combined.includes("focus")) return "attention"
    if (combined.includes("anxiety") || combined.includes("emotional") || combined.includes("mood")) return "emotional"
    if (combined.includes("memory") || combined.includes("cognitive") || combined.includes("brain")) return "cognitive"
    if (combined.includes("social") || combined.includes("autism") || combined.includes("communication"))
      return "social"
    if (combined.includes("sensory") || combined.includes("yoga") || combined.includes("movement")) return "physical"
    return "general"
  }

  const extractAgeGroup = (text: string) => {
    const agePatternsMap = {
      "2-5": /toddler|preschool|2-5|ages 2|ages 3|ages 4|ages 5/i,
      "5-8": /kindergarten|5-8|ages 5|ages 6|ages 7|ages 8/i,
      "8-12": /elementary|8-12|ages 8|ages 9|ages 10|ages 11|ages 12/i,
      "12+": /teen|adolescent|12\+|ages 12|ages 13|ages 14|ages 15/i,
    }

    for (const [range, pattern] of Object.entries(agePatternsMap)) {
      if (pattern.test(text)) return range
    }
    return "5-12" // default
  }

  const assessDifficulty = (title: string, keywords: any) => {
    const combined = (title + " " + (Array.isArray(keywords) ? keywords.join(" ") : "")).toLowerCase()

    if (combined.includes("advanced") || combined.includes("complex") || combined.includes("intermediate"))
      return "intermediate"
    if (combined.includes("beginner") || combined.includes("simple") || combined.includes("basic")) return "beginner"
    return "beginner" // default to beginner for therapeutic content
  }

  useEffect(() => {
    if (selectedKeyword) {
      const keywordFiltered = videoDatabase.filter(
        (video) =>
          video.keywords &&
          video.keywords.some((keyword: string) => keyword.toLowerCase().includes(selectedKeyword.toLowerCase())),
      )
      setFilteredVideos(keywordFiltered)
    } else if (selectedCategory) {
      const categoryFiltered = videoDatabase.filter((video) => video.therapeuticCategory === selectedCategory)
      setFilteredVideos(categoryFiltered)
    } else {
      const results = therapeuticFuzzySearch(searchQuery, videoDatabase)
      setFilteredVideos(results)
    }
  }, [searchQuery, selectedKeyword, selectedCategory, videoDatabase])

  const resetToSampleData = () => {
    setVideoDatabase(sampleVideoDatabase)
    setAllKeywords(therapeuticKeywords)
    setIsUsingCustomData(false)
    setSelectedKeyword(null)
    setSelectedCategory(null)
    setSearchQuery("")
  }

  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(selectedKeyword === keyword ? null : keyword)
    setSelectedCategory(null)
    setSearchQuery("")
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category)
    setSelectedKeyword(null)
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
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">TherapyVids</h1>
              <Badge variant="outline" className="text-xs">
                <Heart className="w-3 h-3 mr-1" />
                Child Wellness
              </Badge>
              {isUsingCustomData && (
                <Badge variant="secondary" className="ml-2">
                  <Database className="w-3 h-3 mr-1" />
                  Backend Dataset
                </Badge>
              )}
            </div>

            <div className="flex-1 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search therapeutic videos (e.g., 'ADHD focus', 'anxiety relief', 'social skills')..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedKeyword(null)
                    setSelectedCategory(null)
                  }}
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

              {isUsingCustomData && (
                <Button variant="outline" size="sm" onClick={resetToSampleData}>
                  Use Sample Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground text-lg">Loading therapeutic videos from dataset...</p>
          </div>
        )}

        {!isLoading && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Therapeutic Categories</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: "attention", label: "Attention & Focus", color: "bg-blue-100 text-blue-800" },
                  { id: "emotional", label: "Emotional Regulation", color: "bg-green-100 text-green-800" },
                  { id: "cognitive", label: "Cognitive Training", color: "bg-purple-100 text-purple-800" },
                  { id: "social", label: "Social Skills", color: "bg-orange-100 text-orange-800" },
                  { id: "physical", label: "Physical & Sensory", color: "bg-pink-100 text-pink-800" },
                ].map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "secondary"}
                    className={`cursor-pointer hover:opacity-80 transition-colors ${
                      selectedCategory === category.id ? "" : category.color
                    }`}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {category.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Therapeutic Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {allKeywords.slice(0, 20).map((keyword) => (
                  <Badge
                    key={keyword}
                    variant={selectedKeyword === keyword ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors text-xs"
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
                {selectedCategory
                  ? `Showing ${selectedCategory} therapy videos`
                  : selectedKeyword
                    ? `Videos for "${selectedKeyword}"`
                    : searchQuery
                      ? `Therapeutic search results for "${searchQuery}"`
                      : "Recommended therapeutic content"}{" "}
                ({filteredVideos.length} videos)
                {isUsingCustomData && <span className="ml-2 text-xs">• Using your custom dataset</span>}
              </p>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img
                        src={video.thumbnail || "/placeholder.svg?height=200&width=300&query=therapeutic kids video"}
                        alt={video.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                      {video.therapeuticCategory && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-xs bg-white/90 text-gray-800">
                            {video.therapeuticCategory}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>

                      <p className="text-xs text-muted-foreground mb-2">{video.channel}</p>

                      <div className="flex items-center gap-2 mb-2">
                        {video.ageGroup && (
                          <Badge variant="outline" className="text-xs">
                            Ages {video.ageGroup}
                          </Badge>
                        )}
                        {video.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {video.difficulty}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViews(video.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {video.likes}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {video.keywords &&
                          video.keywords.slice(0, 2).map((keyword: string) => (
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
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">No therapeutic videos found matching your search.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  Try searching for specific conditions like "ADHD", "anxiety", or browse our therapeutic categories
                  above.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
