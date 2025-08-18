# Dataset Instructions

Place your YouTube dataset CSV file in this folder with the name `youtube_dataset.csv`.

## Expected CSV Columns

Your CSV file should contain the following columns (case-insensitive):
- `title` - Video title
- `url` - Video URL (YouTube video link)
- `viewCount` or `views` - Number of views
- `likes` - Number of likes
- `channelName` or `channel` - Channel name
- `channelUrl` - Channel URL
- `numberOfSubscribers` or `subscribers` - Subscriber count
- `duration` - Video duration (format: MM:SS or HH:MM:SS)
- `date` or `publishedAt` - Publication date
- `description` (optional) - Video description

## Example CSV Format

\`\`\`csv
title,url,viewCount,date,likes,channelName,channelUrl,numberOfSubscribers,duration
"ABC Song for Kids","https://youtube.com/watch?v=abc123",1500000,"2024-01-15",8500,"Kids Learning TV","https://youtube.com/channel/xyz",750000,"3:45"
"Numbers 1-10 Learning","https://youtube.com/watch?v=def456",890000,"2024-01-10",4200,"Educational Fun","https://youtube.com/channel/abc",420000,"5:12"
\`\`\`

## How It Works

1. Place your CSV file as `youtube_dataset.csv` in this `data` folder
2. The system automatically reads and processes your dataset
3. Videos are displayed with YouTube thumbnails extracted from URLs
4. Fuzzy logic search works across all video titles and extracted keywords
5. Click any video to play it in a modal player

The recommendation system will use your actual YouTube data for fuzzy matching and video suggestions.
