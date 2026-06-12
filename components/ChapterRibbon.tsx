import type { Article } from "@/types/journey";

type ChapterRibbonProps = {
  articleList: Article[];
  currentArticleIndex: number;
  hoveredArticleIndex: number | null;
  onSelectArticle: (index: number) => void;
  onHoverArticle: (index: number | null) => void;
};

export default function ChapterRibbon({
  articleList,
  currentArticleIndex,
  hoveredArticleIndex,
  onSelectArticle,
  onHoverArticle,
}: ChapterRibbonProps) {
  const displayedArticleIndex = hoveredArticleIndex ?? currentArticleIndex;

  return (
    <div className="chapterRibbon">
      <div className="activeChapterTitle">
        {articleList[displayedArticleIndex]?.title}
      </div>

      <div className="chapterNumbers">
        {articleList.map((article, index) => (
          <button
            key={article.id}
            onClick={() => onSelectArticle(index)}
            onMouseEnter={() => onHoverArticle(index)}
            onMouseLeave={() => onHoverArticle(null)}
            className={index === currentArticleIndex ? "active" : ""}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}