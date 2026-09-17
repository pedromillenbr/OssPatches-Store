import { useState } from 'react';

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
  // O Twemoji não usa o seletor de variação (FE0F) no nome do arquivo, exceto
  // em sequências com ZWJ (200D). Mantê-lo gerava 404 e imagem quebrada
  // (ex.: ⚖️ = 2696-fe0f, mas o arquivo é 2696.svg).
  const hasZwj = codePoints.includes('200d');
  const parts = hasZwj ? codePoints : codePoints.filter((c) => c !== 'fe0f');
  return parts.join('-');
}

export default function Emoji({ char, size = 24, className = '' }: EmojiProps) {
  const [failed, setFailed] = useState(false);
  const cp = toCodePoint(char);

  // Se a imagem não carregar (CDN fora do ar, emoji novo), mostra o próprio
  // emoji como texto em vez do ícone de imagem quebrada.
  if (failed) {
    return (
      <span
        role="img"
        aria-label={char}
        style={{ fontSize: size, lineHeight: 1 }}
        className={`inline-block select-none ${className}`}
      >
        {char}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/svg/${cp}.svg`}
      alt={char}
      width={size}
      height={size}
      draggable={false}
      onError={() => setFailed(true)}
      className={`inline-block select-none ${className}`}
    />
  );
}
