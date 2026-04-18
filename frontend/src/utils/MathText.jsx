import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * Component để hiển thị text kết hợp với công thức toán học
 * Cú pháp:
 * - $...$ cho công thức inline (trong dòng)
 * - $$...$$ cho công thức block (xuống dòng)
 * - Text thường giữ nguyên
 *
 * Ví dụ: "Giải phương trình $x^2 + 2x + 1 = 0$ với x thuộc R"
 */
export const MathText = ({ children, style }) => {
  if (!children) return null;

  const text = String(children);
  const parts = [];
  let lastIndex = 0;

  // Regex để tìm $$...$$ và $...$
  // Ưu tiên $$ trước, sau đó mới đến $
  const regex = /\$\$([\s\S]+?)\$\$|\$(.+?)\$/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // Thêm text thường trước công thức
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        key: `text-${lastIndex}`,
      });
    }

    // Thêm công thức
    if (match[1] !== undefined) {
      // Block math $$...$$
      parts.push({
        type: 'block',
        content: match[1],
        key: `block-${match.index}`,
      });
    } else if (match[2] !== undefined) {
      // Inline math $...$
      parts.push({
        type: 'inline',
        content: match[2],
        key: `inline-${match.index}`,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Thêm phần text còn lại
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
      key: `text-${lastIndex}`,
    });
  }

  // Nếu không có công thức nào, trả về text thường (có xử lý xuống dòng)
  if (parts.length === 0) {
    return (
      <span style={style}>
        {text.split('\n').map((line, idx, arr) =>
          idx < arr.length - 1 ? (
            <React.Fragment key={idx}>
              {line}
              <br />
            </React.Fragment>
          ) : (
            <React.Fragment key={idx}>{line}</React.Fragment>
          ),
        )}
      </span>
    );
  }

  return (
    <span style={style}>
      {parts.map((part) => {
        switch (part.type) {
          case 'block':
            return (
              <div key={part.key} style={{ margin: '8px 0' }}>
                <BlockMath math={part.content} errorColor="#f00" />
              </div>
            );
          case 'inline':
            return (
              <InlineMath
                key={part.key}
                math={part.content}
                errorColor="#f00"
              />
            );
          case 'text':
            // Xử lý xuống dòng trong text thường
            return (
              <React.Fragment key={part.key}>
                {part.content.split('\n').map((line, idx, arr) =>
                  idx < arr.length - 1 ? (
                    <React.Fragment key={idx}>
                      {line}
                      <br />
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={idx}>{line}</React.Fragment>
                  ),
                )}
              </React.Fragment>
            );
          default:
            return null;
        }
      })}
    </span>
  );
};

export default MathText;
