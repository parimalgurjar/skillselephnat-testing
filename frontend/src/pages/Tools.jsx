
import { useState } from "react";
import { FileText, Trash2, Wrench } from "lucide-react";
import "./Tools.css";

const Tools = () => {
  const [text, setText] = useState("");

  const totalWords = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  const totalCharacters = text.length;

  const handleClear = () => {
    setText("");
  };

  return (
    <div className="tools-page">
      <div className="tools-page-header">
        <div>
          <div className="tools-eyebrow">
            <Wrench size={15} />
            PRODUCTIVITY TOOLS
          </div>

          <h1>Tools</h1>

          <p>
            Useful tools to make your daily work easier.
          </p>
        </div>
      </div>

      <div className="tools-section-heading">
        <h2>Available Tools</h2>
        <span>1 Tool</span>
      </div>

      <div className="tools-word-counter-card">

        <div className="tools-counter-header">
          <div className="tools-counter-icon">
            <FileText size={23} />
          </div>

          <div>
            <h3>Word Counter</h3>
            <p>Count words and characters in your text.</p>
          </div>
        </div>

        <div className="tools-counter-stats">

          <div className="tools-stat-card">
            <span>Total Words</span>
            <strong>{totalWords.toLocaleString("en-IN")}</strong>
          </div>

          <div className="tools-stat-card">
            <span>Characters</span>
            <strong>{totalCharacters.toLocaleString("en-IN")}</strong>
          </div>

        </div>

        <div className="tools-textarea-header">
          <label htmlFor="word-counter-input">
            Enter or paste your text
          </label>

          <button
            type="button"
            onClick={handleClear}
            disabled={!text}
          >
            <Trash2 size={15} />
            Clear Text
          </button>
        </div>

        <textarea
          id="word-counter-input"
          className="tools-word-textarea"
          placeholder="Start typing or paste your paragraph here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="tools-counter-footer">
          Word count updates automatically as you type.
        </div>

      </div>
    </div>
  );
};

export default Tools;
