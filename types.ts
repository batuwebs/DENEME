@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Space+Grotesk:wght@400;500;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Space Grotesk", sans-serif;
  
  --color-primary-container: #00d4ff;
  --color-on-primary-container: #00232a;
  
  --color-secondary-container: #feb700;
  --color-secondary: #feb700;
  --color-on-secondary: #221600;
  
  --color-surface-container: #121b1f;
  --color-background: #0e1417;
  --color-surface-container-low: #0e171b;
  --color-surface-container-lowest: #050a0c;
  --color-surface-container-high: #192329;
  --color-surface-container-highest: #233139;
  
  --color-on-background: #eef5f8;
  --color-on-surface: #eef5f8;
  --color-on-surface-variant: #b0c2cc;
  --color-outline: #6e8694;
  --color-outline-variant: #3e535f;
  --color-error: #ff5449;
}

/* Base resets */
body {
  background-color: #0e1417;
  color: #eef5f8;
  font-family: var(--font-sans);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
}

/* Glassmorphism panel cards */
.glass-card {
  background: rgba(18, 27, 31, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

/* Beautiful custom thin scrollbars */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(14, 20, 23, 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.25);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.55);
}

/* Hide scrollbar classes */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
.scrollbar-none {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
