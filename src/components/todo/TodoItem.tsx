import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star } from 'lucide-react';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  daily?: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAddBelow: (id: string) => void;
  autoFocus?: boolean;
  readOnly?: boolean;
  onToggleDaily?: () => void;
  sectionLabel?: string;
}

export function TodoItem({
  id,
  text,
  completed,
  daily = false,
  onToggle,
  onUpdate,
  onDelete,
  onAddBelow,
  autoFocus = false,
  readOnly = false,
  onToggleDaily,
}: TodoItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && text.trim()) {
      e.preventDefault();
      onAddBelow(id);
    } else if (e.key === 'Backspace' && text === '') {
      e.preventDefault();
      onDelete(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
      className="group flex items-start gap-2 py-0.5 px-1 -mx-1"
    >
      {/* Checkbox */}
      <motion.button
        onClick={() => !readOnly && onToggle(id)}
        className={`todo-checkbox flex-shrink-0 mt-0.5 ${completed ? 'checked' : ''} ${readOnly ? 'cursor-default opacity-60' : ''}`}
        disabled={readOnly}
      >
        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="w-3 h-3 text-(--note-checkbox-tick)" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {readOnly ? (
          <span
            className={`text-sm leading-relaxed ${completed ? 'line-through text-(--note-text-muted)' : 'text-(--note-text)'}`}
          >
            {text}
          </span>
        ) : (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onUpdate(id, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type something..."
            rows={1}
            className={`todo-input text-xs leading-relaxed resize-none overflow-hidden bg-transparent border-none outline-none w-full text-(--note-text) placeholder:text-(--note-text-muted) ${completed ? 'line-through text-(--note-completed-text)' : ''}`}
          />
        )}
      </div>

      {/* Daily toggle */}
      {onToggleDaily && (
        <button onClick={onToggleDaily} className="flex-shrink-0 mt-0.5 transition-colors">
          <Star
            className={`w-3 h-3 transition-colors ${
              daily ? 'text-amber-400 fill-amber-400' : 'text-(--note-control-subtle) hover:text-(--note-control-muted)'
            }`}
          />
        </button>
      )}
    </motion.div>
  );
}
