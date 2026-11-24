import Link from "next/link";
import type { FeedAnswer } from "@/lib/game";
import { aliasEmoji, formatDateTime } from "@/lib/format";
import { LikeButton } from "./LikeButton";
import { SummaryList } from "./SummaryList";

export function AnswerCard({ answer, showTask = true }: { answer: FeedAnswer; showTask?: boolean }) {
  return (
    <article className="surface p-4 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          {showTask ? (
            <Link
              href={`/tasks/${answer.taskSlug}`}
              className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lime-300/70 hover:text-lime-300"
            >
              Задание №{answer.taskNumber} · {answer.taskTitle}
            </Link>
          ) : null}
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-cream-100">
            <span aria-hidden="true" className="text-base">
              {aliasEmoji(answer.alias)}
            </span>
            {answer.alias}
            {answer.isMine ? <span className="chip chip-gold">это ты</span> : null}
          </p>
          <p className="text-[10px] text-cream-100/35">{formatDateTime(answer.createdAt)}</p>
        </div>
        <LikeButton
          submissionId={answer.id}
          initialLikes={answer.likes}
          initialLiked={answer.likedByMe}
          isMine={answer.isMine}
          compact
        />
      </header>
      <div className="mt-3 border-t border-cream-100/10 pt-3">
        <SummaryList items={answer.items} />
      </div>
    </article>
  );
}
