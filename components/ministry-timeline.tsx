'use client';

import { useState } from 'react';
import { ourStoryTimeline } from '../lib/our-story-timeline';

export function MinistryTimeline() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = ourStoryTimeline[activeIndex];

  return <div className="ministry-timeline">
    <div className="timeline-navigation" aria-label="Choose a year in FHA's history">
      {ourStoryTimeline.map((item, index) => <button
        type="button"
        className={index === activeIndex ? 'timeline-year is-active' : 'timeline-year'}
        aria-pressed={index === activeIndex}
        key={item.year}
        onClick={() => setActiveIndex(index)}
      >{item.year}</button>)}
    </div>
    <article className="timeline-feature" aria-live="polite" key={activeItem.year}>
      <span className="eyebrow">{activeItem.year}</span>
      <h3>{activeItem.title}</h3>
      <p>{activeItem.detail}</p>
    </article>
  </div>;
}
