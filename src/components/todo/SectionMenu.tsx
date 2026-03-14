import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GripVertical, Trash2, Archive } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Section {
  id: string;
  title: string;
}

interface SectionMenuProps {
  sections: Section[];
  onScrollTo: (sectionId: string) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onDelete: (sectionId: string) => void;
  onArchive: (sectionId: string) => void;
}

function SortableSectionItem({
  section,
  onScrollTo,
  onDelete,
  onArchive,
  onClose,
}: {
  section: Section;
  onScrollTo: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onClose: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1.5 px-2 py-1.5 hover:bg-(--note-control-bg-hover) transition-colors group text-(--note-text) text-xs ${isDragging ? 'opacity-50 z-50 bg-(--note-control-bg-hover)' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-(--note-control-subtle) hover:text-(--note-control-muted) transition-colors touch-none flex-shrink-0"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => {
          onScrollTo(section.id);
          onClose();
        }}
        className="flex-1 text-left text-xs truncate"
      >
        {section.title || 'Untitled'}
      </button>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(section.id);
            onClose();
          }}
          className="p-1 text-(--note-control-muted) hover:text-(--note-text) transition-colors"
          title="Archive"
        >
          <Archive className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(section.id);
            onClose();
          }}
          className="p-1 text-(--note-control-muted) hover:text-(--note-danger) transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SectionMenu({
  sections,
  onScrollTo,
  onReorder,
  onDelete,
  onArchive,
}: SectionMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({ top: rect.bottom + 4, left: rect.left });
    } else {
      setDropdownStyle(null);
    }
  }, [open]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sections.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    onReorder(oldIndex, newIndex);
  };

  if (sections.length === 0) return null;

  return (
    <div className="inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-(--note-border) bg-(--note-bg) hover:bg-(--note-control-bg-hover) transition-colors text-(--note-text)"
      >
        <span className="font-medium">Sections</span>
        <ChevronDown
          className={`w-3 h-3 text-(--note-control-muted) transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && dropdownStyle && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              style={{ top: dropdownStyle.top, left: dropdownStyle.left }}
              className="fixed z-50 w-72 bg-(--note-bg) border border-(--note-border) rounded-lg shadow-lg overflow-hidden"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="py-1">
                    {sections.map((section) => (
                      <SortableSectionItem
                        key={section.id}
                        section={section}
                        onScrollTo={onScrollTo}
                        onDelete={onDelete}
                        onArchive={onArchive}
                        onClose={() => setOpen(false)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
