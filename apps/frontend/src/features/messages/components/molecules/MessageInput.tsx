import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  sending = false,
  placeholder = 'メッセージを入力...',
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending && !disabled && value.trim().length > 0) {
        onSend();
      }
    }
  };

  const canSend = !sending && !disabled && value.trim().length > 0;

  return (
    <div className='flex gap-2 items-end'>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className='flex-1 min-h-[2rem] max-h-32 border rounded px-3 py-2 text-sm resize-none overflow-y-auto word-break overflow-wrap-anywhere'
        disabled={disabled || sending}
        onKeyDown={handleKeyDown}
        rows={1}
        style={{
          height: 'auto',
          minHeight: '2rem',
        }}
        onInput={e => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = Math.min(target.scrollHeight, 128) + 'px';
        }}
      />
      <button
        onClick={onSend}
        disabled={!canSend}
        className='h-8 w-8 bg-primary text-white rounded flex items-center justify-center flex-shrink-0 disabled:opacity-50'
      >
        <Send className='h-3 w-3' />
      </button>
    </div>
  );
};
