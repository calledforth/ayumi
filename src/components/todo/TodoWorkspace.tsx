import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Plus } from 'lucide-react';
import { useTodoStore } from '@/stores/todoStore';
import { TodoItem } from './TodoItem';

export function TodoWorkspace() {
  const {
    sections,
    lastView,
    isLoaded,
    load,
    setLastView,
    addSection,
    updateSectionTitle,
    archiveSection,
    deleteSection,
    addTodo,
    addTodoBelow,
    toggleTodoCompleted,
    updateTodo,
    deleteTodo,
    toggleDaily,
  } = useTodoStore();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [focusNewTodo, setFocusNewTodo] = useState<string | null>(null);
  const [creatingSectionInSidebar, setCreatingSectionInSidebar] = useState(false);
  const [sidebarSectionName, setSidebarSectionName] = useState('');

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  const activeView = lastView;
  const activeSections = sections.filter((s) => !s.archived);
  const archivedSections = sections.filter((s) => s.archived);

  const isViewingSection = activeView !== 'today' && activeView !== 'all';
  const viewedSection = isViewingSection
    ? sections.find((s) => s.id === activeView)
    : null;
  const isArchivedSection = viewedSection?.archived ?? false;

  useEffect(() => {
    if (!isLoaded) return;
    if (isViewingSection && !viewedSection) setLastView('today');
    // Normalize legacy view ids (tomorrow, thisWeek, nextWeek) -> today or all
    else if (activeView === 'tomorrow') setLastView('today');
    else if (activeView === 'thisWeek' || activeView === 'nextWeek') setLastView('all');
  }, [isLoaded, isViewingSection, viewedSection, activeView, setLastView]);

  const dailyBySection = activeSections
    .map((s) => ({ id: s.id, title: s.title, todos: s.todos.filter((t) => t.daily) }))
    .filter((g) => g.todos.length > 0);

  const handleAddTodoBelow = async (todoId: string) => {
    if (!viewedSection) return;
    const newId = await addTodoBelow(viewedSection.id, todoId);
    setFocusNewTodo(newId);
  };

  const handleAddTodo = async () => {
    if (!viewedSection) return;
    const newId = await addTodo(viewedSection.id);
    setFocusNewTodo(newId);
  };

  const handleSidebarCreateSection = async () => {
    if (!sidebarSectionName.trim()) return;
    const id = await addSection(sidebarSectionName.trim());
    setSidebarSectionName('');
    setCreatingSectionInSidebar(false);
    setLastView(id);
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-(--app-bg) overflow-hidden">
      {/* ── Full-page: Sidebar + Content (like habits) ─────────── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="w-[240px] shrink-0 pt-[20px] pl-5 pr-4 flex flex-col justify-between pb-5 overflow-hidden">
          {/* Sliding container */}
          <div
            className="relative transition-transform duration-250 ease-out"
            style={{
              transform: archiveOpen ? 'translateX(-220px)' : 'translateX(0)',
            }}
          >
            {/* Navigation — clean, no profile, per reference design */}
            <nav className="flex flex-col gap-0.5">
              <SidebarButton
                active={activeView === 'today' && !archiveOpen}
                onClick={() => {
                  setLastView('today');
                  setArchiveOpen(false);
                }}
              >
                Today
              </SidebarButton>

              <SidebarButton
                active={activeView === 'all' && !archiveOpen}
                onClick={() => {
                  setLastView('all');
                  setArchiveOpen(false);
                }}
              >
                All
              </SidebarButton>

              {activeSections.map((section) => (
                <SidebarButton
                  key={section.id}
                  active={activeView === section.id && !archiveOpen}
                  onClick={() => {
                    setLastView(section.id);
                    setArchiveOpen(false);
                  }}
                  onArchive={() => archiveSection(section.id)}
                >
                  {section.title || 'Untitled'}
                </SidebarButton>
              ))}

              {/* Inline section creation */}
              {creatingSectionInSidebar ? (
                <input
                  autoFocus
                  value={sidebarSectionName}
                  onChange={(e) => setSidebarSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSidebarCreateSection();
                    if (e.key === 'Escape') {
                      setCreatingSectionInSidebar(false);
                      setSidebarSectionName('');
                    }
                  }}
                  onBlur={() => {
                    setCreatingSectionInSidebar(false);
                    setSidebarSectionName('');
                  }}
                  placeholder="Section name…"
                  className="text-[14px] px-2 py-0.5 w-full bg-transparent outline-none text-(--note-text) placeholder:text-(--note-text-muted) font-medium rounded-full"
                />
              ) : (
                <button
                  onClick={() => setCreatingSectionInSidebar(true)}
                  className="text-left text-[14px] font-medium py-0.5 px-2 rounded-full text-(--note-text-muted) hover:text-(--note-text) transition-colors w-full cursor-pointer"
                >
                  + New section
                </button>
              )}
            </nav>

            {/* Archive panel (offset right, slides in) */}
            <div
              className="absolute top-0 left-5 right-3 bottom-5 flex flex-col"
              style={{ transform: 'translateX(220px)' }}
            >
              <button
                onClick={() => setArchiveOpen(false)}
                className="text-left text-[11px] font-semibold text-(--note-text-muted) uppercase tracking-wider mb-3 px-2 hover:text-(--note-text) transition-colors duration-100 cursor-pointer"
              >
                ← Back
              </button>

              <h3 className="text-[13px] font-semibold text-(--note-text-muted) uppercase tracking-wider px-2 mb-3">
                Archived
              </h3>

              <nav className="flex flex-col gap-0.5">
                {archivedSections.map((section) => (
                  <SidebarButton
                    key={section.id}
                    active={activeView === section.id}
                    onClick={() => setLastView(section.id)}
                  >
                    {section.title || 'Untitled'}
                  </SidebarButton>
                ))}
                {archivedSections.length === 0 && (
                  <p className="text-[13px] text-(--note-text-muted)/50 px-2">
                    No archived sections
                  </p>
                )}
              </nav>
            </div>
          </div>

          {/* Archive toggle — always visible at bottom */}
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-100 cursor-pointer ${
              archiveOpen
                ? 'bg-accent text-(--note-text)'
                : 'text-(--note-text-muted) hover:text-(--note-text) hover:bg-accent/60'
            }`}
            title="Archive"
          >
            <Archive size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Content area — padded + max-width to sit slightly centered ── */}
        <div className="flex-1 overflow-y-auto pt-5 pb-14 px-5 md:px-8">
          <div className="mx-auto w-full max-w-4xl">
            <AnimatePresence mode="wait">
            {activeView === 'today' && !archiveOpen ? (
              <motion.div
                key="today"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {dailyBySection.length === 0 ? (
                  <EmptyState message="No daily todos yet" />
                ) : (
                  <div className="flex flex-col">
                    {dailyBySection.flatMap((group) =>
                      group.todos.map((todo) => (
                        <TaskRow
                          key={todo.id}
                          category={group.title}
                          text={todo.text}
                          completed={todo.completed}
                          onClick={() =>
                            toggleTodoCompleted(group.id, todo.id)
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            ) : activeView === 'all' && !archiveOpen ? (
              <motion.div
                key="all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                {activeSections.length === 0 ? (
                  <EmptyState message="No sections yet" />
                ) : (
                  <div className="flex flex-col">
                    {activeSections.flatMap((section) =>
                      section.todos.map((todo) => (
                        <TaskRow
                          key={todo.id}
                          category={section.title}
                          text={todo.text}
                          completed={todo.completed}
                          onClick={() =>
                            toggleTodoCompleted(section.id, todo.id)
                          }
                        />
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            ) : viewedSection ? (
              <motion.div
                key={viewedSection.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <SectionPageView
                  section={viewedSection}
                  readOnly={isArchivedSection}
                  focusNewTodo={focusNewTodo}
                  onTitleChange={updateSectionTitle}
                  onAddTodo={handleAddTodo}
                  onAddTodoBelow={handleAddTodoBelow}
                  onToggle={toggleTodoCompleted}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                  onToggleDaily={toggleDaily}
                  onArchive={archiveSection}
                  onDeleteSection={deleteSection}
                />
              </motion.div>
            ) : (
              <EmptyState message="Select a view" />
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function SidebarButton({
  active,
  onClick,
  onArchive,
  children,
}: {
  active: boolean;
  onClick: () => void;
  onArchive?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left text-[14px] py-0.5 px-2 rounded-full transition-colors duration-100 relative cursor-pointer ${
        active
          ? 'text-(--note-text) font-semibold'
          : 'text-(--note-text-muted) font-medium hover:text-(--note-text)'
      }`}
    >
      <span className="truncate block pr-6">{children}</span>

      {onArchive && (
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-(--note-control-muted) hover:text-(--note-text)"
          title="Archive"
        >
          <Archive className="w-3 h-3" />
        </span>
      )}
    </button>
  );
}

function TaskRow({
  category,
  text,
  completed,
  onClick,
}: {
  category: string;
  text: string;
  completed: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center py-2.5 border-b border-(--note-border)/20 last:border-b-0 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <span className="w-[170px] shrink-0 text-[15px] text-(--note-text-muted) tracking-tight">
        {category}
      </span>
      <span
        className={`flex-1 text-[15px] font-medium tracking-tight ${
          completed
            ? 'line-through text-(--note-text-muted)'
            : 'text-(--note-text)'
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-(--note-text-muted)">
      <p className="text-sm">{message}</p>
    </div>
  );
}

function SectionPageView({
  section,
  readOnly,
  focusNewTodo,
  onTitleChange,
  onAddTodo,
  onAddTodoBelow,
  onToggle,
  onUpdate,
  onDelete,
  onToggleDaily,
  onArchive,
  onDeleteSection,
}: {
  section: { id: string; title: string; todos: { id: string; text: string; completed: boolean; daily?: boolean }[] };
  readOnly: boolean;
  focusNewTodo: string | null;
  onTitleChange: (sectionId: string, title: string) => void;
  onAddTodo: () => void;
  onAddTodoBelow: (todoId: string) => void;
  onToggle: (sectionId: string, todoId: string) => void;
  onUpdate: (sectionId: string, todoId: string, text: string) => void;
  onDelete: (sectionId: string, todoId: string) => void;
  onToggleDaily: (sectionId: string, todoId: string) => void;
  onArchive: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
}) {
  const allCompleted =
    section.todos.length > 0 && section.todos.every((t) => t.completed);

  return (
    <div>
      {/* Editable title */}
      {!readOnly ? (
        <input
          value={section.title}
          onChange={(e) => onTitleChange(section.id, e.target.value)}
          className="text-lg font-semibold bg-transparent outline-none mb-4 w-full text-(--note-text) placeholder:text-(--note-text-muted)"
          placeholder="Section name…"
        />
      ) : (
        <h2 className="text-lg font-semibold mb-4 text-(--note-text)">
          {section.title}
        </h2>
      )}

      {/* Divider */}
      <div className="h-px bg-(--note-border) mb-3" />

      {/* Completion actions */}
      <AnimatePresence>
        {allCompleted && !readOnly && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 mb-3 overflow-hidden"
          >
            <span className="text-xs text-(--note-text-muted)">Done!</span>
            <button
              onClick={() => onArchive(section.id)}
              className="flex items-center gap-1 text-(--note-control-muted) hover:text-(--note-text) text-xs transition-colors"
            >
              <Archive className="w-3 h-3" />
              Archive
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Todos */}
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {section.todos.map((todo) => (
            <TodoItem
              key={todo.id}
              id={todo.id}
              text={todo.text}
              completed={todo.completed}
              daily={todo.daily}
              readOnly={readOnly}
              autoFocus={focusNewTodo === todo.id}
              onToggle={(todoId) => onToggle(section.id, todoId)}
              onUpdate={(todoId, text) => onUpdate(section.id, todoId, text)}
              onDelete={(todoId) => onDelete(section.id, todoId)}
              onAddBelow={(todoId) => onAddTodoBelow(todoId)}
              onToggleDaily={
                readOnly
                  ? undefined
                  : () => onToggleDaily(section.id, todo.id)
              }
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add item */}
      {!readOnly && (
        <motion.button
          onClick={onAddTodo}
          className="flex items-center gap-1.5 text-(--note-text-muted) hover:text-(--note-text) transition-colors mt-3 py-0.5 text-xs cursor-pointer"
          whileHover={{ x: 2 }}
        >
          <Plus className="w-3 h-3" />
          <span>Add item</span>
        </motion.button>
      )}

      {section.todos.length === 0 && (
        <div className="text-center py-8 text-(--note-text-muted)">
          <p className="text-sm">
            {readOnly ? 'No items in this section' : 'No items yet — add one above'}
          </p>
        </div>
      )}
    </div>
  );
}
