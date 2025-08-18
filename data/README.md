# Dataset Instructions

Place your YouTube dataset CSV file in this folder with the name `youtube_dataset.csv`.

## Expected CSV Columns

Your CSV file should contain the following columns (case-insensitive):
- `title` - Video title
- `url` - Video URL
- `viewCount` or `views` - Number of views
- `likes` - Number of likes
- `channelName` or `channel` - Channel name
- `channelUrl` - Channel URL
- `numberOfSubscribers` or `subscribers` - Subscriber count
- `duration` - Video duration
- `date` or `publishedAt` - Publication date
- `description` (optional) - Video description

The system will automatically categorize videos for therapeutic content based on titles and descriptions.
