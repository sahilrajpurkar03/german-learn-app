const script = `try{var t=localStorage.getItem("sprechen-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme}catch(e){}`;

/** Applies the saved light/dark choice before the page paints (system setting otherwise). */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
