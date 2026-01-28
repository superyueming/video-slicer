#!/usr/bin/env python3
"""
视频处理服务 - 被Node.js后端调用
"""

import sys
import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict
import whisper


def extract_audio(video_path: str, output_audio: str) -> bool:
    """从视频中提取音频"""
    try:
        cmd = [
            'ffmpeg', '-i', video_path,
            '-vn',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            output_audio
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False


def transcribe_audio_whisper(audio_path: str) -> Dict:
    """使用Whisper转录音频"""
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, language='zh', verbose=False)
    return result


def cut_video_segment(video_path: str, start: float, end: float, output_path: str) -> bool:
    """切割视频片段"""
    try:
        duration = end - start
        cmd = [
            'ffmpeg', '-i', video_path,
            '-ss', str(start),
            '-t', str(duration),
            '-c', 'copy',
            '-y',
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False


def concatenate_videos(video_paths: List[str], output_path: str) -> bool:
    """拼接多个视频"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        for vp in video_paths:
            f.write(f"file '{vp}'\n")
        list_file = f.name
    
    try:
        cmd = [
            'ffmpeg', '-f', 'concat',
            '-safe', '0',
            '-i', list_file,
            '-c', 'copy',
            '-y',
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False
    finally:
        os.unlink(list_file)


def format_srt_time(seconds: float) -> str:
    """将秒数转换为SRT时间格式"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def generate_srt(segments: List[Dict], transcript: Dict, output_path: str):
    """生成SRT字幕文件"""
    selected_ranges = [(seg['start'], seg['end']) for seg in segments]
    
    srt_content = []
    subtitle_index = 1
    time_offset = 0.0
    
    for seg_range in selected_ranges:
        start_time, end_time = seg_range
        
        for wseg in transcript['segments']:
            if wseg['start'] >= start_time and wseg['end'] <= end_time:
                new_start = wseg['start'] - start_time + time_offset
                new_end = wseg['end'] - start_time + time_offset
                
                start_str = format_srt_time(new_start)
                end_str = format_srt_time(new_end)
                
                srt_content.append(f"{subtitle_index}")
                srt_content.append(f"{start_str} --> {end_str}")
                srt_content.append(wseg['text'].strip())
                srt_content.append("")
                
                subtitle_index += 1
        
        time_offset += (end_time - start_time)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(srt_content))


def burn_subtitles(video_path: str, srt_path: str, output_path: str) -> bool:
    """将字幕烧录到视频中"""
    try:
        srt_path_escaped = srt_path.replace('\\', '/').replace(':', '\\:')
        cmd = [
            'ffmpeg', '-i', video_path,
            '-vf', f"subtitles={srt_path_escaped}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2'",
            '-c:a', 'copy',
            '-y',
            output_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except subprocess.CalledProcessError:
        return False


def main():
    """主函数 - 接收JSON输入，返回JSON输出"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing command"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    try:
        if command == "extract_audio":
            video_path = sys.argv[2]
            output_audio = sys.argv[3]
            success = extract_audio(video_path, output_audio)
            print(json.dumps({"success": success}))
        
        elif command == "transcribe":
            audio_path = sys.argv[2]
            result = transcribe_audio_whisper(audio_path)
            print(json.dumps(result, ensure_ascii=False))
        
        elif command == "cut_segment":
            video_path = sys.argv[2]
            start = float(sys.argv[3])
            end = float(sys.argv[4])
            output_path = sys.argv[5]
            success = cut_video_segment(video_path, start, end, output_path)
            print(json.dumps({"success": success}))
        
        elif command == "concatenate":
            video_paths = json.loads(sys.argv[2])
            output_path = sys.argv[3]
            success = concatenate_videos(video_paths, output_path)
            print(json.dumps({"success": success}))
        
        elif command == "generate_srt":
            segments = json.loads(sys.argv[2])
            transcript = json.loads(sys.argv[3])
            output_path = sys.argv[4]
            generate_srt(segments, transcript, output_path)
            print(json.dumps({"success": True}))
        
        elif command == "burn_subtitles":
            video_path = sys.argv[2]
            srt_path = sys.argv[3]
            output_path = sys.argv[4]
            success = burn_subtitles(video_path, srt_path, output_path)
            print(json.dumps({"success": success}))
        
        else:
            print(json.dumps({"error": f"Unknown command: {command}"}))
            sys.exit(1)
    
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
