'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Eye,
  ThumbsUp,
  Loader2,
  X,
  Clock,
  Users,
  BookOpen,
  Heart,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Fuzzy matching function using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function fuzzySearch(query: string, videos: any[]): any[] {
  if (!query.trim()) return videos;

  const queryLower = query.toLowerCase();

  return videos
    .map((video) => {
      let maxScore = 0;

      // Title similarity
      const titleScore =
        1 -
        levenshteinDistance(queryLower, video.title.toLowerCase()) /
          Math.max(queryLower.length, video.title.length);
      maxScore = Math.max(maxScore, titleScore);

      // Channel similarity
      const channelScore =
        1 -
        levenshteinDistance(queryLower, video.channel.toLowerCase()) /
          Math.max(queryLower.length, video.channel.length);
      maxScore = Math.max(maxScore, channelScore * 0.7); // Channel match is less important

      // Keyword matching
      if (video.keywords && Array.isArray(video.keywords)) {
        video.keywords.forEach((keyword: string) => {
          const keywordScore =
            1 -
            levenshteinDistance(queryLower, keyword.toLowerCase()) /
              Math.max(queryLower.length, keyword.length);
          maxScore = Math.max(maxScore, keywordScore);

          // Exact or partial matches
          if (
            keyword.toLowerCase().includes(queryLower) ||
            queryLower.includes(keyword.toLowerCase())
          ) {
            maxScore = Math.max(maxScore, 0.8);
          }
        });
      }

      return { ...video, score: maxScore };
    })
    .filter((video) => video.score > 0.3)
    .sort((a, b) => b.score - a.score);
}

// Redefine categories based on the emotion labels output by the QSVC pipeline
const CONTENT_CATEGORIES = {
  JOY: { label: 'Joyful', icon: Heart, color: 'bg-red-100 text-red-800' },
  NEUTRAL: { label: 'Neutral', icon: Eye, color: 'bg-gray-100 text-gray-800' },
  ANGER: { label: 'Angry', icon: X, color: 'bg-pink-100 text-pink-800' },
  SADNESS: { label: 'Sad', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  FEAR: {
    label: 'Scared',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
  },
  SURPRISE: {
    label: 'Surprise',
    icon: Users,
    color: 'bg-green-100 text-green-800',
  },
  DISGUST: {
    label: 'Disgust',
    icon: Filter,
    color: 'bg-purple-100 text-purple-800',
  },
};

/**
 * Simulates fetching the emotion classification results from a trained QSVC model.
 * It is structured to return a single emotion label as the category.
 */
function getQSVCClassification(video: any): {
  categories: string[];
  score: number;
} {
  const title = video.title.toLowerCase();

  // --- Simulated QSVC/Emotion-based Classification Logic ---

  let predictedEmotion: keyof typeof CONTENT_CATEGORIES = 'NEUTRAL';

  // Simplified keyword mapping to simulate QSVC emotion output for the frontend
  if (
    title.includes('learn') ||
    title.includes('alphabet') ||
    title.includes('numbers') ||
    title.includes('story')
  ) {
    predictedEmotion = 'JOY';
  } else if (title.includes('bedtime') || title.includes('relax')) {
    predictedEmotion = 'SADNESS';
  } else if (
    title.includes('muddy') ||
    title.includes('fun') ||
    title.includes('party')
  ) {
    predictedEmotion = 'SURPRISE';
  } else if (title.includes('scary') || title.includes('fight')) {
    predictedEmotion = 'FEAR';
  } else if (title.includes('loud') || title.includes('yell')) {
    predictedEmotion = 'ANGER';
  } else if (title.includes('gross') || title.includes('yucky')) {
    predictedEmotion = 'DISGUST';
  }

  // Return only the single emotion label as the category. Score is fixed/ignored.
  return {
    categories: [predictedEmotion],
    score: 50, // Fixed placeholder score, as health score logic is removed.
  };
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function VideoPlayer({ video, onClose }: { video: any; onClose: () => void }) {
  if (!video) return null;

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(video.url);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
    : null;

  return (
    <div className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4'>
      <div className='bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden'>
        <div className='flex items-center justify-between p-4 border-b'>
          <h2 className='text-lg font-semibold line-clamp-1'>{video.title}</h2>
          <Button variant='ghost' size='sm' onClick={onClose}>
            <X className='w-4 h-4' />
          </Button>
        </div>

        <div className='aspect-video'>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className='w-full h-full'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-muted'>
              <p className='text-muted-foreground'>Video cannot be played</p>
            </div>
          )}
        </div>

        <div className='p-4'>
          <p className='text-sm text-muted-foreground mb-2'>{video.channel}</p>
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Eye className='w-4 h-4' />
              {video.views} views
            </div>
            <div className='flex items-center gap-1'>
              <ThumbsUp className='w-4 h-4' />
              {video.likes} likes
            </div>
            <span>{video.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationSystem() {
  const [videoDatabase, setVideoDatabase] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [contentFilter, setContentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance'); // Keep relevance as default sort option

  const loadDatasetFromBackend = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/videos');
      if (!response.ok) {
        throw new Error('Failed to load dataset');
      }

      const data = await response.json();
      console.log(
        '[v0] Loaded dataset from backend:',
        data.videos.length,
        'videos'
      );

      // The API now performs server-side inference and adds `emotion_label` and
      // `healthCategories` to each video when possible. Use those values if present.
      const enhancedVideos = data.videos.map((video: any) => {
        return {
          ...video,
          healthCategories:
            video.healthCategories ||
            (video.emotion_label
              ? [String(video.emotion_label).toUpperCase()]
              : undefined),
          healthScore: video.healthScore || 0,
        };
      });

      setVideoDatabase(enhancedVideos);
      setSearchQuery('');
    } catch (error) {
      console.error('Error loading dataset:', error);
      alert(
        'Failed to load dataset. Please check if the CSV file exists in the data folder.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetFromBackend();
  }, []);

  useEffect(() => {
    // Define blocked keywords for fear and aggressive content
    const fearKeywords = ['scary','terrifying','horror','nightmare','creepy','frightening','afraid','terror','panic','anxious','spooky','haunted','ghost','monster','scream','blood','death','dead','kill','dark','evil'];
    const aggressiveKeywords = ['angry','hate','fight','violent','rage','furious','punch','destroy','attack','aggressive','war','weapon','shoot','explosion','bomb','gun','revenge','enemy','battle','combat'];
    const blockedKeywords = [...fearKeywords, ...aggressiveKeywords];

    // Block videos when searching for blocked keywords
    const searchLower = searchQuery.toLowerCase();
    const shouldBlockContent = blockedKeywords.some(keyword => searchLower.includes(keyword));
    
    if (shouldBlockContent) {
      // If searching for blocked keywords, return empty results
      setFilteredVideos([]);
      return;
    }

    let results = fuzzySearch(searchQuery, videoDatabase);

    if (contentFilter !== 'all') {
      results = results.filter(
        (video) =>
          video.healthCategories &&
          video.healthCategories.includes(contentFilter)
      );
    }

    // Only allow sorting by relevance and duration, removing health score sort
    if (sortBy === 'duration') {
      results.sort(
        (a, b) => parseDuration(b.duration) - parseDuration(a.duration)
      );
    }
    // Sorting by relevance is default (already handled by fuzzySearch)

    setFilteredVideos(results);
  }, [searchQuery, videoDatabase, contentFilter, sortBy]);

  const formatViews = (views: string | number) => {
    const num = typeof views === 'string' ? Number.parseInt(views) || 0 : views;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (duration: string) => duration;

  const getYouTubeThumbnail = (url: string) => {
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    return '/video-thumbnail.png';
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-40 bg-background border-b border-border'>
        <div className='container mx-auto px-4 py-3'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 bg-red-600 rounded flex items-center justify-center'>
                <Play className='w-5 h-5 text-white fill-white' />
              </div>
              <h1 className='text-xl font-bold'>EmotionClassifier</h1>
            </div>

            <div className='flex-1 max-w-2xl mx-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  placeholder='Search videos...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='pl-10 pr-4'
                />
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={loadDatasetFromBackend}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Loading...
                  </>
                ) : (
                  'Reload Dataset'
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className='container mx-auto px-4 py-6'>
        {!isLoading && (
          <div className='flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg'>
            <div className='text-sm text-muted-foreground'>
              Showing {filteredVideos.length} videos
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className='text-center py-12'>
            <Loader2 className='w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin' />
            <p className='text-muted-foreground text-lg'>
              Loading videos from dataset...
            </p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Results Info */}
            <div className='mb-4'>
              <p className='text-muted-foreground'>
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : 'All videos'}{' '}
                ({filteredVideos.length} videos)
              </p>
            </div>

            {/* Video Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className='group cursor-pointer hover:shadow-lg transition-shadow'
                  onClick={() => setSelectedVideo(video)}
                >
                  <CardContent className='p-0'>
                    <div className='relative'>
                      <img
                        src={
                          getYouTubeThumbnail(video.url) || '/placeholder.svg'
                        }
                        alt={video.title}
                        className='w-full h-48 object-cover rounded-t-lg'
                        onError={(e) => {
                          e.currentTarget.src = '/video-thumbnail.png';
                        }}
                      />
                      <div className='absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded'>
                        {formatDuration(video.duration)}
                      </div>
                      {/* Removed health score badge */}
                      <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center'>
                        <Play className='w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white' />
                      </div>
                    </div>

                    <div className='p-3'>
                      <h3 className='font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors'>
                        {video.title}
                      </h3>

                      <p className='text-xs text-muted-foreground mb-2'>
                        {video.channel}
                      </p>

                      <div className='flex items-center gap-4 text-xs text-muted-foreground mb-2'>
                        <div className='flex items-center gap-1'>
                          <Eye className='w-3 h-3' />
                          {formatViews(video.views)}
                        </div>
                        <div className='flex items-center gap-1'>
                          <ThumbsUp className='w-3 h-3' />
                          {formatViews(video.likes)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredVideos.length === 0 && !isLoading && (
              <div className='text-center py-12'>
                <Search className='w-16 h-16 mx-auto mb-4 text-muted-foreground' />
                <p className='text-muted-foreground text-lg'>
                  No videos found matching your criteria.
                </p>
                <p className='text-muted-foreground text-sm mt-2'>
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

// "use client"

// import { useState, useEffect } from "react"
// import { Search, Play, Eye, ThumbsUp, Loader2, X, Clock, Users, BookOpen, Heart, Filter } from "lucide-react"
// import { Input } from "@/components/ui/input"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// // Fuzzy matching function using Levenshtein distance
// function levenshteinDistance(str1: string, str2: string): number {
//   const matrix = []

//   for (let i = 0; i <= str2.length; i++) {
//     matrix[i] = [i]
//   }

//   for (let j = 0; j <= str1.length; j++) {
//     matrix[0][j] = j
//   }

//   for (let i = 1; i <= str2.length; i++) {
//     for (let j = 1; j <= str1.length; j++) {
//       if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
//         matrix[i][j] = matrix[i - 1][j - 1]
//       } else {
//         matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
//       }
//     }
//   }

//   return matrix[str2.length][str1.length]
// }

// function fuzzySearch(query: string, videos: any[]): any[] {
//   if (!query.trim()) return videos

//   const queryLower = query.toLowerCase()

//   return videos
//     .map((video) => {
//       let maxScore = 0

//       // Title similarity
//       const titleScore =
//         1 - levenshteinDistance(queryLower, video.title.toLowerCase()) / Math.max(queryLower.length, video.title.length)
//       maxScore = Math.max(maxScore, titleScore)

//       // Channel similarity
//       const channelScore =
//         1 -
//         levenshteinDistance(queryLower, video.channel.toLowerCase()) / Math.max(queryLower.length, video.channel.length)
//       maxScore = Math.max(maxScore, channelScore * 0.7) // Channel match is less important

//       // Keyword matching
//       if (video.keywords && Array.isArray(video.keywords)) {
//         video.keywords.forEach((keyword: string) => {
//           const keywordScore =
//             1 - levenshteinDistance(queryLower, keyword.toLowerCase()) / Math.max(queryLower.length, keyword.length)
//           maxScore = Math.max(maxScore, keywordScore)

//           // Exact or partial matches
//           if (keyword.toLowerCase().includes(queryLower) || queryLower.includes(keyword.toLowerCase())) {
//             maxScore = Math.max(maxScore, 0.8)
//           }
//         })
//       }

//       return { ...video, score: maxScore }
//     })
//     .filter((video) => video.score > 0.3)
//     .sort((a, b) => b.score - a.score)
// }

// const CONTENT_CATEGORIES = {
//   EDUCATIONAL: { label: "Educational", icon: BookOpen, color: "bg-blue-100 text-blue-800" },
//   COLLABORATIVE: { label: "Co-Viewing", icon: Users, color: "bg-green-100 text-green-800" },
//   CALMING: { label: "Calming", icon: Heart, color: "bg-purple-100 text-purple-800" },
//   SLOW_PACED: { label: "Slow-Paced", icon: Clock, color: "bg-orange-100 text-orange-800" },
// }

// function analyzeContentHealth(video: any) {
//   const title = video.title.toLowerCase()
//   const duration = parseDuration(video.duration)
//   const categories = []

//   // Educational content detection
//   const educationalKeywords = [
//     "learn",
//     "educational",
//     "story time",
//     "science",
//     "diy",
//     "tutorial",
//     "alphabet",
//     "numbers",
//     "phonics",
//   ]
//   if (educationalKeywords.some((keyword) => title.includes(keyword))) {
//     categories.push("EDUCATIONAL")
//   }

//   // Collaborative viewing content
//   const collaborativeKeywords = ["family", "parent", "together", "craft", "activity", "sing along"]
//   if (collaborativeKeywords.some((keyword) => title.includes(keyword))) {
//     categories.push("COLLABORATIVE")
//   }

//   // Calming content
//   const calmingKeywords = ["calm", "relax", "bedtime", "lullaby", "nature", "meditation", "quiet", "peaceful"]
//   if (calmingKeywords.some((keyword) => title.includes(keyword))) {
//     categories.push("CALMING")
//   }

//   // Slow-paced content (longer duration videos)
//   if (duration > 600) {
//     // 10+ minutes
//     categories.push("SLOW_PACED")
//   }

//   return categories
// }

// function parseDuration(duration: string): number {
//   if (!duration) return 0
//   const parts = duration.split(":").map(Number)
//   if (parts.length === 2) return parts[0] * 60 + parts[1]
//   if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
//   return 0
// }

// function calculateHealthScore(video: any): number {
//   let score = 0
//   const title = video.title.toLowerCase()
//   const duration = parseDuration(video.duration)

//   // Positive factors
//   const positiveKeywords = ["educational", "learn", "story", "calm", "nature", "family", "creative", "art", "music"]
//   const positiveMatches = positiveKeywords.filter((keyword) => title.includes(keyword)).length
//   score += positiveMatches * 20

//   // Duration bonus for longer, slower content
//   if (duration > 300) score += 15 // 5+ minutes
//   if (duration > 600) score += 25 // 10+ minutes

//   // Penalty for potentially overstimulating content
//   const negativeKeywords = ["fast", "crazy", "loud", "action", "fight", "scary"]
//   const negativeMatches = negativeKeywords.filter((keyword) => title.includes(keyword)).length
//   score -= negativeMatches * 15

//   return Math.max(0, Math.min(100, score))
// }

// function VideoPlayer({ video, onClose }: { video: any; onClose: () => void }) {
//   if (!video) return null

//   // Extract YouTube video ID from URL
//   const getYouTubeVideoId = (url: string) => {
//     const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
//     const match = url.match(regex)
//     return match ? match[1] : null
//   }

//   const videoId = getYouTubeVideoId(video.url)
//   const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null

//   return (
//     <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
//       <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
//         <div className="flex items-center justify-between p-4 border-b">
//           <h2 className="text-lg font-semibold line-clamp-1">{video.title}</h2>
//           <Button variant="ghost" size="sm" onClick={onClose}>
//             <X className="w-4 h-4" />
//           </Button>
//         </div>

//         <div className="aspect-video">
//           {embedUrl ? (
//             <iframe
//               src={embedUrl}
//               className="w-full h-full"
//               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//               allowFullScreen
//             />
//           ) : (
//             <div className="w-full h-full flex items-center justify-center bg-muted">
//               <p className="text-muted-foreground">Video cannot be played</p>
//             </div>
//           )}
//         </div>

//         <div className="p-4">
//           <p className="text-sm text-muted-foreground mb-2">{video.channel}</p>
//           <div className="flex items-center gap-4 text-sm text-muted-foreground">
//             <div className="flex items-center gap-1">
//               <Eye className="w-4 h-4" />
//               {video.views} views
//             </div>
//             <div className="flex items-center gap-1">
//               <ThumbsUp className="w-4 h-4" />
//               {video.likes} likes
//             </div>
//             <span>{video.duration}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default function RecommendationSystem() {
//   const [videoDatabase, setVideoDatabase] = useState<any[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [filteredVideos, setFilteredVideos] = useState<any[]>([])
//   const [selectedVideo, setSelectedVideo] = useState<any>(null)
//   const [contentFilter, setContentFilter] = useState<string>("all")
//   const [sortBy, setSortBy] = useState<string>("relevance")

//   const loadDatasetFromBackend = async () => {
//     setIsLoading(true)
//     try {
//       const response = await fetch("/api/videos")
//       if (!response.ok) {
//         throw new Error("Failed to load dataset")
//       }

//       const data = await response.json()
//       console.log("[v0] Loaded dataset from backend:", data.videos.length, "videos")

//       const enhancedVideos = data.videos.map((video: any) => ({
//         ...video,
//         healthCategories: analyzeContentHealth(video),
//         healthScore: calculateHealthScore(video),
//       }))

//       setVideoDatabase(enhancedVideos)
//       setSearchQuery("")
//     } catch (error) {
//       console.error("Error loading dataset:", error)
//       alert("Failed to load dataset. Please check if the CSV file exists in the data folder.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   useEffect(() => {
//     loadDatasetFromBackend()
//   }, [])

//   useEffect(() => {
//     let results = fuzzySearch(searchQuery, videoDatabase)

//     if (contentFilter !== "all") {
//       results = results.filter((video) => video.healthCategories && video.healthCategories.includes(contentFilter))
//     }

//     if (sortBy === "health") {
//       results.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0))
//     } else if (sortBy === "duration") {
//       results.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration))
//     }

//     setFilteredVideos(results)
//   }, [searchQuery, videoDatabase, contentFilter, sortBy])

//   const formatViews = (views: string | number) => {
//     const num = typeof views === "string" ? Number.parseInt(views) || 0 : views
//     if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
//     if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
//     return num.toString()
//   }

//   const formatDuration = (duration: string) => duration

//   const getYouTubeThumbnail = (url: string) => {
//     const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
//     const match = url.match(regex)
//     if (match) {
//       return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
//     }
//     return "/video-thumbnail.png"
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="sticky top-0 z-40 bg-background border-b border-border">
//         <div className="container mx-auto px-4 py-3">
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
//                 <Play className="w-5 h-5 text-white fill-white" />
//               </div>
//               <h1 className="text-xl font-bold">HealthyKidsVideo</h1>
//               <Badge variant="outline" className="text-xs">
//                 <Heart className="w-3 h-3 mr-1" />
//                 Healthy Content
//               </Badge>
//             </div>

//             <div className="flex-1 max-w-2xl mx-auto">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//                 <Input
//                   placeholder="Search healthy videos for children..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10 pr-4"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <Button variant="outline" size="sm" onClick={loadDatasetFromBackend} disabled={isLoading}>
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     Loading...
//                   </>
//                 ) : (
//                   "Reload Dataset"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="container mx-auto px-4 py-6">
//         {!isLoading && (
//           <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
//             <div className="flex items-center gap-2">
//               <Filter className="w-4 h-4 text-muted-foreground" />
//               <span className="text-sm font-medium">Filters:</span>
//             </div>

//             <Select value={contentFilter} onValueChange={setContentFilter}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="Content Type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Content</SelectItem>
//                 <SelectItem value="EDUCATIONAL">Educational</SelectItem>
//                 <SelectItem value="COLLABORATIVE">Co-Viewing</SelectItem>
//                 <SelectItem value="CALMING">Calming</SelectItem>
//                 <SelectItem value="SLOW_PACED">Slow-Paced</SelectItem>
//               </SelectContent>
//             </Select>

//             <Select value={sortBy} onValueChange={setSortBy}>
//               <SelectTrigger className="w-48">
//                 <SelectValue placeholder="Sort By" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="relevance">Relevance</SelectItem>
//                 <SelectItem value="health">Health Score</SelectItem>
//                 <SelectItem value="duration">Duration</SelectItem>
//               </SelectContent>
//             </Select>

//             <div className="text-sm text-muted-foreground">Showing {filteredVideos.length} healthy videos</div>
//           </div>
//         )}

//         {/* Loading state */}
//         {isLoading && (
//           <div className="text-center py-12">
//             <Loader2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-spin" />
//             <p className="text-muted-foreground text-lg">Loading healthy videos from dataset...</p>
//           </div>
//         )}

//         {!isLoading && (
//           <>
//             {/* Results Info */}
//             <div className="mb-4">
//               <p className="text-muted-foreground">
//                 {searchQuery ? `Search results for "${searchQuery}"` : "All videos"} ({filteredVideos.length} videos)
//               </p>
//             </div>

//             {/* Video Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//               {filteredVideos.map((video) => (
//                 <Card
//                   key={video.id}
//                   className="group cursor-pointer hover:shadow-lg transition-shadow"
//                   onClick={() => setSelectedVideo(video)}
//                 >
//                   <CardContent className="p-0">
//                     <div className="relative">
//                       <img
//                         src={getYouTubeThumbnail(video.url) || "/placeholder.svg"}
//                         alt={video.title}
//                         className="w-full h-48 object-cover rounded-t-lg"
//                         onError={(e) => {
//                           e.currentTarget.src = "/video-thumbnail.png"
//                         }}
//                       />
//                       <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
//                         {formatDuration(video.duration)}
//                       </div>
//                       {video.healthScore > 60 && (
//                         <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
//                           <Heart className="w-3 h-3" />
//                           {video.healthScore}
//                         </div>
//                       )}
//                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-lg flex items-center justify-center">
//                         <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
//                       </div>
//                     </div>

//                     <div className="p-3">
//                       <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
//                         {video.title}
//                       </h3>

//                       <p className="text-xs text-muted-foreground mb-2">{video.channel}</p>

//                       <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
//                         <div className="flex items-center gap-1">
//                           <Eye className="w-3 h-3" />
//                           {formatViews(video.views)}
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <ThumbsUp className="w-3 h-3" />
//                           {formatViews(video.likes)}
//                         </div>
//                       </div>

//                       <div className="flex flex-wrap gap-1">
//                         {video.healthCategories &&
//                           video.healthCategories.slice(0, 2).map((category: string) => {
//                             const categoryInfo = CONTENT_CATEGORIES[category as keyof typeof CONTENT_CATEGORIES]
//                             const Icon = categoryInfo.icon
//                             return (
//                               <Badge key={category} variant="outline" className={`text-xs ${categoryInfo.color}`}>
//                                 <Icon className="w-3 h-3 mr-1" />
//                                 {categoryInfo.label}
//                               </Badge>
//                             )
//                           })}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>

//             {filteredVideos.length === 0 && !isLoading && (
//               <div className="text-center py-12">
//                 <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
//                 <p className="text-muted-foreground text-lg">No healthy videos found matching your criteria.</p>
//                 <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or search terms.</p>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {selectedVideo && <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
//     </div>
//   )
// }
