"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Folder,
  FolderOpen,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Edit3,
  Check,
  Tag,
  Search,
  Sigma,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useSemester } from "@/context/semester-context";
import { Topbar } from "@/components/layout/topbar";
import { MathRenderer } from "@/components/math/math-renderer";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string;
  isBookmarked: boolean;
  updatedAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export default function NotesVaultPage() {
  const { activeSemesterId } = useSemester();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string | null>(null);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
  const [bookmarkOnly, setBookmarkOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notes?semesterId=${activeSemesterId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setSubjects(data.subjects || []);
        if (data.notes?.length > 0 && !selectedNoteId) {
          selectNote(data.notes[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeSemesterId]);

  const selectNote = (note: NoteItem) => {
    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags);
    setIsEditing(false);
  };

  const activeNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  const handleSaveEdit = async () => {
    if (!activeNote) return;
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeNote.id,
          title: editTitle,
          content: editContent,
          tags: editTags,
        }),
      });

      if (res.ok) {
        toast.success("Note saved!");
        setIsEditing(false);
        setNotes((prev) =>
          prev.map((n) =>
            n.id === activeNote.id
              ? {
                  ...n,
                  title: editTitle,
                  content: editContent,
                  tags: editTags,
                  updatedAt: new Date().toISOString(),
                }
              : n
          )
        );
      }
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleToggleBookmark = async () => {
    if (!activeNote) return;
    const nextVal = !activeNote.isBookmarked;
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeNote.id,
          isBookmarked: nextVal,
        }),
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === activeNote.id ? { ...n, isBookmarked: nextVal } : n))
      );
      toast.info(nextVal ? "Note bookmarked" : "Bookmark removed");
    } catch {
      toast.error("Error updating bookmark");
    }
  };

  const handleCreateNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: activeSemesterId,
          subjectId: selectedSubjectFilter || subjects[0]?.id || null,
          title: "Untitled Note",
          content: "### Notes & Key Definitions\n\nWrite formula statements using $E = mc^2$ or block LaTeX:\n$$\\int_{a}^{b} f(x) dx$$\n",
          folder: selectedFolderFilter || "Class Notes",
          tags: "Formulas,Study",
          isBookmarked: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        selectNote(data.note);
        setIsEditing(true);
        toast.success("New note created!");
      }
    } catch {
      toast.error("Failed to create note");
    }
  };

  const handleDeleteNote = async () => {
    if (!activeNote) return;
    if (!confirm(`Delete note "${activeNote.title}"?`)) return;
    try {
      const res = await fetch(`/api/notes?id=${activeNote.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note deleted");
        const remaining = notes.filter((n) => n.id !== activeNote.id);
        setNotes(remaining);
        if (remaining.length > 0) selectNote(remaining[0]);
        else setSelectedNoteId(null);
      }
    } catch {
      toast.error("Error deleting note");
    }
  };

  const insertFormulaSnippet = (snippet: string) => {
    setEditContent((prev) => prev + "\n" + snippet);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (bookmarkOnly && !n.isBookmarked) return false;
    if (selectedSubjectFilter && n.subject?.id !== selectedSubjectFilter) return false;
    if (selectedFolderFilter && n.folder !== selectedFolderFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-background">
      <Topbar
        title="Notes & Academic Vault"
        subtitle="Searchable engineering knowledge repository with LaTeX formulas and subject taxonomy"
        actions={
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border rounded-xl bg-card overflow-hidden shadow-sm min-h-[680px]">
          {/* Column 1: Vault Navigation Tree (3 cols) */}
          <div className="md:col-span-3 border-r border-border p-4 space-y-4 bg-muted/10">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>Academic Vault</span>
              <span className="font-mono text-muted-foreground">{notes.length} items</span>
            </div>

            <div className="space-y-1 text-xs">
              <button
                onClick={() => {
                  setSelectedSubjectFilter(null);
                  setSelectedFolderFilter(null);
                  setBookmarkOnly(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left",
                  !selectedSubjectFilter && !selectedFolderFilter && !bookmarkOnly
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Notes</span>
              </button>

              <button
                onClick={() => {
                  setBookmarkOnly(true);
                  setSelectedSubjectFilter(null);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left",
                  bookmarkOnly
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Bookmarks</span>
              </button>
            </div>

            {/* Subjects Tree */}
            <div className="pt-2 border-t border-border space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Semester {activeSemesterId} Subjects
              </div>
              <div className="space-y-0.5">
                {subjects.map((s) => {
                  const isSelected = selectedSubjectFilter === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSubjectFilter(s.id);
                        setBookmarkOnly(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                        isSelected
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{s.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Folders Taxonomy */}
            <div className="pt-2 border-t border-border space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                Folders
              </div>
              {["Class Notes", "Formulas", "Previous Papers"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setSelectedFolderFilter(selectedFolderFilter === f ? null : f);
                    setBookmarkOnly(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left",
                    selectedFolderFilter === f
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{f}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column 2: Notes List (3 cols) */}
          <div className="md:col-span-3 border-r border-border p-3 space-y-3 bg-card flex flex-col justify-between">
            <div className="space-y-3">
              {/* Search input */}
              <div className="flex items-center px-2 py-1.5 rounded-lg border border-border bg-muted/20 text-xs">
                <Search className="w-3.5 h-3.5 text-muted-foreground mr-2" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground text-xs"
                />
              </div>

              {/* Notes List */}
              <div className="space-y-1.5 max-h-[550px] overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No notes matching filter.
                  </div>
                ) : (
                  filteredNotes.map((n) => {
                    const isSelected = n.id === activeNote?.id;
                    return (
                      <div
                        key={n.id}
                        onClick={() => selectNote(n)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all space-y-1",
                          isSelected
                            ? "bg-muted/50 border-foreground/30 shadow-sm"
                            : "bg-card border-border hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-foreground truncate">
                            {n.title}
                          </span>
                          {n.isBookmarked && (
                            <BookmarkCheck className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {n.content.replace(/[\#\$\*]/g, "")}
                        </p>
                        <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground">
                          <span>{n.subject?.code || n.folder}</span>
                          <span>{formatDate(n.updatedAt)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              onClick={handleCreateNote}
              className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Note</span>
            </button>
          </div>

          {/* Column 3: Rich Note Viewer & Editor (6 cols) */}
          <div className="md:col-span-6 p-6 space-y-5 bg-card overflow-y-auto flex flex-col justify-between">
            {activeNote ? (
              <div className="space-y-5">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-lg font-bold text-foreground bg-transparent border-b border-border focus:outline-none w-full"
                      />
                    ) : (
                      <h2 className="text-lg font-bold tracking-tight text-foreground">
                        {activeNote.title}
                      </h2>
                    )}
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      Last edited {formatDate(activeNote.updatedAt)} • Folder: {activeNote.folder}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleToggleBookmark}
                      title={activeNote.isBookmarked ? "Remove Bookmark" : "Bookmark Note"}
                      className="p-1.5 rounded border border-border hover:bg-muted text-foreground transition-colors"
                    >
                      {activeNote.isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 fill-current" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Note</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      onClick={handleDeleteNote}
                      title="Delete Note"
                      className="p-1.5 rounded border border-border hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Comma-separated tags (e.g. Calculus, Formulas)"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="text-xs p-1.5 rounded border border-border bg-background text-foreground w-full"
                    />
                  ) : (
                    activeNote.tags.split(",").map((tag) => {
                      const t = tag.trim();
                      if (!t) return null;
                      return (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground"
                        >
                          {t}
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Math helper toolbar in edit mode */}
                {isEditing && (
                  <div className="p-2 rounded-lg border border-border bg-muted/20 flex flex-wrap items-center gap-1 text-[11px] font-mono">
                    <span className="text-[10px] text-muted-foreground mr-1">Insert Formula:</span>
                    <button
                      onClick={() => insertFormulaSnippet("$$\\frac{d}{dx}(x^n) = n x^{n-1}$$")}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted text-foreground"
                    >
                      d/dx
                    </button>
                    <button
                      onClick={() => insertFormulaSnippet("$$\\int_{a}^{b} f(x) dx$$")}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted text-foreground"
                    >
                      Integral
                    </button>
                    <button
                      onClick={() =>
                        insertFormulaSnippet(
                          "$$A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$"
                        )
                      }
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted text-foreground"
                    >
                      Matrix
                    </button>
                    <button
                      onClick={() => insertFormulaSnippet("$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$")}
                      className="px-2 py-0.5 rounded border border-border bg-card hover:bg-muted text-foreground"
                    >
                      Summation
                    </button>
                  </div>
                )}

                {/* Note Content (Viewer or Editor) */}
                {isEditing ? (
                  <textarea
                    rows={18}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-4 rounded-xl border border-border bg-background text-foreground font-mono text-xs leading-relaxed focus:outline-none"
                  />
                ) : (
                  <div className="rounded-xl border border-border bg-muted/10 p-6 leading-relaxed">
                    <MathRenderer content={activeNote.content} />
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <p>No note selected. Choose a note from the left or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
