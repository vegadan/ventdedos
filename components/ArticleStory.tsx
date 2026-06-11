import { useEffect, useState } from "react";
import type { Article } from "@/types/journey";

type ArticleStoryProps = {
  activeArticle: Article;
};

export default function ArticleStory({ activeArticle }: ArticleStoryProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const fullText = activeArticle.text ?? "Texte de l’article à ajouter ici...";
    const animatedLength = 1000;

    let index = 0;
    let timeoutId: number | undefined;

    const writeNext = () => {
      index += 10;

      if (index >= Math.min(animatedLength, fullText.length)) {
        setDisplayedText(fullText);
        return;
      }

      setDisplayedText(fullText.slice(0, index));
      timeoutId = window.setTimeout(writeNext, 18);
    };

    timeoutId = window.setTimeout(() => {
      setDisplayedText("");
      writeNext();
    }, 0);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeArticle.id, activeArticle.text]);

  return (
    <div className="articleStoryTape">
      <div className="articleStoryText">
        <p>
          {displayedText}
          <span className="writingCursor">|</span>
        </p>
      </div>
    </div>
  );
}