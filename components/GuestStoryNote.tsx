"use client";

import { useState } from "react";
import type { GuestStory } from "@/types/journey";

type Props = {
  story: GuestStory;
};

export default function GuestStoryNote({ story }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className={`guestStoryNote ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="guestStoryNoteButton"
        onClick={() => setIsOpen((value) => !value)}
      >
        Note d’{story.author}
      </button>

      <div className="guestStoryNotePaper">
        <p>{story.text}</p>
      </div>
    </aside>
  );
}