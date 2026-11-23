import { useToggleLike } from '../api/traces.js';

export function LikeButton({ trace, size = 'md' }) {
  const toggle = useToggleLike();
  const { liked, likeCount } = trace;
  return (
    <button
      type="button"
      className={`like like--${size}${liked ? ' is-liked' : ''}`}
      aria-pressed={liked}
      aria-label={liked ? `Retirer mon like (${likeCount})` : `Liker cette trace (${likeCount})`}
      title={toggle.isError ? toggle.error.message : undefined}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle.mutate({ id: trace.id, liked });
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.3 4 6.3 4c2.3 0 3.8 1.3 4.7 2.6h2C13.9 5.3 15.4 4 17.7 4c4 0 5.9 4.4 4.3 7.7C19.5 16.4 12 21 12 21z" />
      </svg>
      <span className="like__count">{likeCount}</span>
    </button>
  );
}
