import { memo } from 'react';
import { ExternalLink, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Exercise } from '@/types';

interface VideoSheetProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getEmbedUrl(url: string): string | null {
  // YouTube: convert watch?v= or youtu.be/ to embed URL
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/
  );
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }
  return null;
}

export const VideoSheet = memo(function VideoSheet({
  exercise,
  open,
  onOpenChange,
}: VideoSheetProps) {
  if (!exercise) return null;

  const videoUrl = exercise.video_url;
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70dvh] bg-bg-surface">
        <SheetHeader>
          <SheetTitle className="text-text-primary">{exercise.name}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-4">
          {embedUrl ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-bg-elevated">
              <iframe
                src={embedUrl}
                title={`${exercise.name} video`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : videoUrl ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Video size={32} className="text-text-tertiary" />
              <p className="text-sm text-text-secondary text-center">
                This video can't be embedded directly.
              </p>
              <Button
                onClick={() => window.open(videoUrl, '_blank', 'noopener')}
                className="bg-accent-primary text-bg-root hover:bg-accent-hover"
              >
                <ExternalLink size={14} className="mr-1" />
                Open Video
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Video size={32} className="text-text-tertiary" />
              <p className="text-sm text-text-tertiary">
                No video available for this exercise.
              </p>
            </div>
          )}

          {/* Tips */}
          {exercise.beginner_tips && (
            <div className="rounded-lg bg-accent-primary/10 border border-accent-primary/20 px-3 py-2">
              <span className="text-xs font-medium text-accent-primary">Tip: </span>
              <span className="text-xs text-text-secondary">{exercise.beginner_tips}</span>
            </div>
          )}

          {/* Exercise details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-bg-elevated px-3 py-2">
              <span className="text-text-tertiary">Category: </span>
              <span className="text-text-primary capitalize">{exercise.category}</span>
            </div>
            <div className="rounded-lg bg-bg-elevated px-3 py-2">
              <span className="text-text-tertiary">Difficulty: </span>
              <span className="text-text-primary capitalize">{exercise.difficulty}</span>
            </div>
            <div className="rounded-lg bg-bg-elevated px-3 py-2">
              <span className="text-text-tertiary">Hypertrophy: </span>
              <span className="text-text-primary">{exercise.rep_range_hypertrophy}</span>
            </div>
            <div className="rounded-lg bg-bg-elevated px-3 py-2">
              <span className="text-text-tertiary">Strength: </span>
              <span className="text-text-primary">{exercise.rep_range_strength}</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});
