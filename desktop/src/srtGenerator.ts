import { WhisperSegment } from "./_core/voiceTranscription";

/**
 * Convert seconds to SRT timestamp format (HH:MM:SS,mmm)
 */
function secondsToSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

/**
 * Generate SRT subtitle file from Whisper segments
 * @param segments - Array of Whisper segments with timestamps
 * @param timeOffset - Optional time offset in seconds (for segment merging)
 * @returns SRT formatted string
 */
export function generateSRT(segments: WhisperSegment[], timeOffset: number = 0): string {
  const srtLines: string[] = [];

  segments.forEach((segment, index) => {
    // Segment number (1-indexed)
    srtLines.push((index + 1).toString());

    // Timestamp line: start --> end
    const startTime = secondsToSRTTime(segment.start + timeOffset);
    const endTime = secondsToSRTTime(segment.end + timeOffset);
    srtLines.push(`${startTime} --> ${endTime}`);

    // Text content
    srtLines.push(segment.text.trim());

    // Empty line separator
    srtLines.push('');
  });

  return srtLines.join('\n');
}

/**
 * Merge multiple SRT strings (for audio segmentation)
 * @param srtSegments - Array of {srt: string, duration: number}
 * @returns Combined SRT string
 */
export function mergeSRTs(srtSegments: Array<{ srt: string, duration: number }>): string {
  let combinedSRT = '';
  let currentOffset = 0;
  let currentIndex = 1;

  for (const { srt, duration } of srtSegments) {
    // Parse each SRT segment and adjust timestamps
    const lines = srt.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a timestamp line
      if (line.includes('-->')) {
        const [startStr, endStr] = line.split('-->').map(s => s.trim());
        
        // Parse and adjust timestamps
        const start = srtTimeToSeconds(startStr) + currentOffset;
        const end = srtTimeToSeconds(endStr) + currentOffset;
        
        // Add segment number
        combinedSRT += `${currentIndex}\n`;
        currentIndex++;
        
        // Add adjusted timestamp
        combinedSRT += `${secondsToSRTTime(start)} --> ${secondsToSRTTime(end)}\n`;
        
        // Add text (next line)
        if (i + 1 < lines.length) {
          combinedSRT += lines[i + 1] + '\n\n';
          i++; // Skip the text line
        }
      }
    }
    
    currentOffset += duration;
  }

  return combinedSRT;
}

/**
 * Convert SRT timestamp to seconds
 */
function srtTimeToSeconds(timeStr: string): number {
  const [time, millis] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + Number(millis) / 1000;
}
