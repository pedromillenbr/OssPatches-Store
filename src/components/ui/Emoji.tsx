interface EmojiProps {
  char: string;
  size?: number;
  className?: string;
}

function toCodePoint(emoji: string): string {
  const codePoints: string[] = [];
  let i = 0;
  while (i < emoji.length) {
    const code = emoji.codePointAt(i)!;
    codePoints.push(code.toString(16));
    i += code > 0xffff ? 2 : 1;
  }
  return codePoints.join('-');
}

export default function Emoji({ char, size = 24, className = '' }: EmojiProps) {
  const cp = toCodePoint(char);
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/svg/${cp}.svg`}
      alt={char}
      width={size}
      height={size}
      draggable={false}
      className={`inline-block select-none ${className}`}
    />
  );
}
