"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLikeAction } from "@/lib/actions";

type Props = {
  submissionId: number;
  initialLikes: number;
  initialLiked: boolean;
  isMine?: boolean;
  compact?: boolean;
};

export function LikeButton({ submissionId, initialLikes, initialLiked, isMine = false, compact = false }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await toggleLikeAction(submissionId);
      if (!result.ok) {
        setError(result.message ?? "Не удалось поставить лайк");
        return;
      }
      setLiked(result.liked);
      setLikes(result.likes);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || isMine}
        aria-pressed={liked}
        aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
          liked
            ? "border-berry-400/60 bg-berry-400/15 text-berry-400"
            : "border-cream-100/20 bg-cream-100/5 text-cream-100/70 hover:border-berry-400/50 hover:text-berry-400"
        } ${isMine ? "opacity-60" : ""}`}
        title={isMine ? "За свой ответ лайк поставить нельзя" : "Поставить лайк ответу"}
      >
        <span aria-hidden="true" className={liked ? "animate-pop" : undefined}>
          {liked ? "❤️" : "🤍"}
        </span>
        {compact ? likes : `${likes} · ${liked ? "нравится" : "симпатии"}`}
      </button>
      {error ? <span className="max-w-[14rem] text-right text-[10px] leading-tight text-berry-400">{error}</span> : null}
    </div>
  );
}
