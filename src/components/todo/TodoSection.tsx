import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Archive, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { TodoItem } from './TodoItem';
import type { Todo } from '@/stores/todoStore';

interface TodoSectionProps {
  id: string;
  title: string;
  todos: Todo[];
  onTitleChange: (id: string, title: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  onToggleDaily?: (sectionId: string, todoId: string) => void;
  onAddTodo: (sectionId: string) => Promise<string>;
  onAddTodoBelow: (sectionId: string, todoId: string) => Promise<string>;
  onToggleTodo: (sectionId: string, todoId: string) => void;
  onUpdateTodo: (sectionId: string, todoId: string, text: string) => void;
  onDeleteTodo: (sectionId: string, todoId: string) => void;
}

export function TodoSection({
  id,
  title,
  todos,
  onTitleChange,
  onArchive,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  onToggleDaily,
  onAddTodo,
  onAddTodoBelow,
  onToggleTodo,
  onUpdateTodo,
  onDeleteTodo,
}: TodoSectionProps) {
  const [focusNewTodo, setFocusNewTodo] = useState<string | null>(null);

  const allCompleted = todos.length > 0 && todos.every((t) => t.completed);

  const addTodo = async () => {
    const newId = await onAddTodo(id);
    setFocusNewTodo(newId);
  };

  const addTodoBelow = async (todoId: string) => {
    const newId = await onAddTodoBelow(id, todoId);
    setFocusNewTodo(newId);
  };

  return (
    <div id={`section-${id}`} className="mb-6">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-2 group/title">
        <div className="flex items-center gap-0.5 opacity-0 group-hover/title:opacity-100 transition-opacity">
          <div className="flex flex-col -space-y-1">
            {!isFirst && (
              <button
                onClick={() => onMoveUp?.(id)}
                className="text-(--note-control-subtle) hover:text-(--note-text) transition-colors"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
            {!isLast && (
              <button
                onClick={() => onMoveDown?.(id)}
                className="text-(--note-control-subtle) hover:text-(--note-text) transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(id, e.target.value)}
          placeholder="Section name..."
          className="section-title bg-transparent border-none outline-none flex-1 text-(--note-text) placeholder:text-(--note-text-muted)"
        />
        <AnimatePresence>
          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-(--note-text-muted)">Done!</span>
              <button
                onClick={() => onArchive(id)}
                className="archive-prompt flex items-center gap-1 text-(--note-control-muted) hover:text-(--note-text) text-xs"
              >
                <Archive className="w-3 h-3" />
                Archive
              </button>
              <button
                onClick={() => onDelete(id)}
                className="archive-prompt flex items-center gap-1 text-(--note-control-muted) hover:text-(--note-danger) text-xs"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px bg-(--note-border) mb-3" />

      {/* Todos */}
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              id={todo.id}
              text={todo.text}
              completed={todo.completed}
              daily={todo.daily}
              onToggle={(todoId) => onToggleTodo(id, todoId)}
              onUpdate={(todoId, text) => onUpdateTodo(id, todoId, text)}
              onDelete={(todoId) => onDeleteTodo(id, todoId)}
              onAddBelow={addTodoBelow}
              autoFocus={focusNewTodo === todo.id}
              onToggleDaily={onToggleDaily ? () => onToggleDaily(id, todo.id) : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add Todo Button */}
      <motion.button
        onClick={addTodo}
        className="flex items-center gap-1.5 text-(--note-text-muted) hover:text-(--note-text) transition-colors mt-2 py-0.5 text-xs"
        whileHover={{ x: 2 }}
      >
        <Plus className="w-3 h-3" />
        <span>Add item</span>
      </motion.button>
    </div>
  );
}
