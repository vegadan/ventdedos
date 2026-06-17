import { useEffect, useState } from "react";
import type { Article } from "@/types/journey";

type ArticleStoryProps = {
  activeArticle: Article;
  isMapOnly: boolean;
};

export default function ArticleStory({ activeArticle, isMapOnly}: ArticleStoryProps) {

  const [displayedText, setDisplayedText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fullText = activeArticle.text_ia_v1 ?? "Texte de l’article à ajouter ici...";
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
  }, [activeArticle.id, activeArticle.text_ia_v1]);

  if (isMapOnly) 
  {
    return (
    <div className="articleArea">
      <div className="articleStoryTape articleStoryIntro">
        <img src="/images/logo.webp" alt="Vent de Dos" className="articleIntroLogo"/>
        <div className="articleStoryText articleIntroText">
           <p>
            C&apos;est l&apos;histoire d&apos;un couple parti à la découverte de l&apos;Europe à l&apos;aide
            d&apos;un moyen de locomotion simple, écologique et ouvert sur le monde.
          </p>

          <p>
            Jour après jour, kilomètre après kilomètre, le vélo devient bien plus
            qu&apos;un moyen de transport : une invitation à la rencontre, à l&apos;aventure
            et à la découverte.
          </p>

          <p>
            Une aventure portée par un sentiment de liberté infini.
        </p>
        </div>
      </div>
    </div>
  );
  }
  else
  {
    return (
      <div className="articleArea">
        <div className="articleStoryTape">
          <div className="articleStoryText">
            <p>
              {displayedText}
              <span className="writingCursor">|</span>
            </p>
          </div>
        </div>

        {activeArticle.guestStory && (              
            <aside className={`guestStoryNote ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="guestStoryNoteButton"
                onClick={() => setIsOpen((value) => !value)}
              >
                Note d’{activeArticle.guestStory.author}
              </button>

              <div className="guestStoryNotePaper">
                <p>{activeArticle.guestStory.text}</p>
              </div>
            </aside>
        )}
      </div>
    );
  }

}