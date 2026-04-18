import katex from 'katex';

export const renderMath = (latex) => {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
    });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return latex;
  }
};

export const renderMathBlock = (latex) => {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
    });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return latex;
  }
};