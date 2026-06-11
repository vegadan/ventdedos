import type { Article } from "@/types/journey";

type ChapterRibbonProps = {
  articleList: Article[];
  currentArticleIndex: number;
  onSelectArticle: (index: number) => void;
};

export default function ChapterRibbon({
  articleList,
  currentArticleIndex,
  onSelectArticle,
}: ChapterRibbonProps) {
  return (
    <div className="chapterRibbon">
      <div className="activeChapterTitle">
        {articleList[currentArticleIndex]?.title}
      </div>

      <div className="chapterNumbers">
        {articleList.map((article, index) => (
          <button
            key={article.id}
            onClick={() => onSelectArticle(index)}
            className={index === currentArticleIndex ? "active" : ""}
          >
            {String(index + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
    </div>
  );
}